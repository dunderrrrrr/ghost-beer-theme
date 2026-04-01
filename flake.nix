{
  description = "Ghost theme local development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            python3
            python3Packages.setuptools
            gcc
            gnumake
          ];

          shellHook = ''
            export PRJ_ROOT="$PWD"
            export GHOST_DIR="$PRJ_ROOT/.ghost-local"
            export THEME_DIR="$PRJ_ROOT/theme"
            export THEME_NAME="$(basename "$PRJ_ROOT")"

            # Install ghost-cli into a local npm prefix so it doesn't pollute the system
            export NPM_PREFIX="$PRJ_ROOT/.npm-global"
            export PATH="$NPM_PREFIX/bin:$PATH"

            echo "👻 Ghost theme dev — $THEME_NAME"
            echo ""
            echo "First time setup:"
            echo "  ghost-install   Install Ghost locally (run once)"
            echo ""
            echo "Daily workflow:"
            echo "  ghost-up        Start Ghost + symlink theme"
            echo "  ghost-down      Stop Ghost"
            echo "  ghost-logs      Follow Ghost logs"
            echo "  gscan           Validate theme"
            echo "  ghost-deploy    Bump version, build zip, upload to production"
            echo ""
            echo "Admin: http://localhost:2368/ghost"
            echo ""

            # Install ghost-cli globally into local prefix if not present
            if ! command -v ghost &> /dev/null; then
              echo "Installing ghost-cli..."
              npm install -g --prefix "$NPM_PREFIX" ghost-cli
            fi

            ghost-install() {
              if [ -d "$GHOST_DIR" ] && [ "$(ls -A "$GHOST_DIR")" != "content" ]; then
                echo "Ghost already installed at $GHOST_DIR"
                return
              fi
              rm -rf "$GHOST_DIR"
              mkdir -p "$GHOST_DIR"
              (cd "$GHOST_DIR" && ghost install local --no-prompt)
              echo "Installing sqlite3..."
              GHOST_VERSION=$(ls "$GHOST_DIR/versions/")
              (cd "$GHOST_DIR/versions/$GHOST_VERSION" && npm install sqlite3@latest --legacy-peer-deps --no-save)
              _ghost-link-theme
            }

            ghost-up() {
              (cd "$GHOST_DIR" && ghost start)
              _ghost-link-theme
              echo ""
              echo "Theme '$THEME_NAME' linked."
              echo "Handlebars changes take effect on browser refresh."
              echo "For CSS/JS, run your build step."
              echo ""
              echo "Admin: http://localhost:2368/ghost"
            }

            ghost-down() {
              (cd "$GHOST_DIR" && ghost stop)
            }

            ghost-logs() {
              tail -f "$GHOST_DIR/content/logs/"*.log 2>/dev/null \
                || echo "No log files found — is Ghost running?"
            }

            gscan() {
              if ! command -v gscan &> /dev/null; then
                npm install -g --prefix "$NPM_PREFIX" gscan
              fi
              gscan "$THEME_DIR"
            }

            _ghost-link-theme() {
              local link="$GHOST_DIR/content/themes/$THEME_NAME"
              mkdir -p "$GHOST_DIR/content/themes"
              if [ ! -L "$link" ]; then
                echo "Linking theme '$THEME_NAME' into Ghost..."
                ln -s "$THEME_DIR" "$link"
                echo "Done. Activate it in Ghost Admin → Settings → Design."
              fi
            }

            ghost-deploy() {
              local pkg="$THEME_DIR/package.json"
              local zip="$THEME_DIR/dist/beer.zip"

              # Load .env from project root
              if [ -f "$PRJ_ROOT/.env" ]; then
                set -a; source "$PRJ_ROOT/.env"; set +a
              fi

              local GHOST_ADMIN_URL="$API_URL"
              local GHOST_ADMIN_KEY="$ADMIN_API_KEY"

              # Require env vars
              if [ -z "$GHOST_ADMIN_URL" ] || [ -z "$GHOST_ADMIN_KEY" ]; then
                echo "Error: API_URL and ADMIN_API_KEY must be set in .env"
                return 1
              fi

              # Bump patch version in package.json
              local old_ver new_ver
              old_ver=$(node -p "require('$pkg').version")
              new_ver=$(node -e "
                const v = '$old_ver'.split('.').map(Number);
                v[2]++;
                console.log(v.join('.'));
              ")
              node -e "
                const fs = require('fs');
                const p = JSON.parse(fs.readFileSync('$pkg', 'utf8'));
                p.version = '$new_ver';
                fs.writeFileSync('$pkg', JSON.stringify(p, null, 4) + '\n');
              "
              echo "Bumped version: $old_ver → $new_ver"

              # Build zip
              echo "Building zip..."
              (cd "$THEME_DIR" && npm run zip) || return 1

              # Generate JWT for Ghost Admin API
              local key_id key_secret token issued_at
              key_id=$(echo "$GHOST_ADMIN_KEY" | cut -d: -f1)
              key_secret=$(echo "$GHOST_ADMIN_KEY" | cut -d: -f2)
              issued_at=$(date +%s)
              token=$(node -e "
                const crypto = require('crypto');
                const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT',kid:'$key_id'})).toString('base64url');
                const payload = Buffer.from(JSON.stringify({iat:$issued_at,exp:$issued_at+300,aud:'/admin/'})).toString('base64url');
                const sig = crypto.createHmac('sha256', Buffer.from('$key_secret','hex'))
                  .update(header+'.'+payload).digest('base64url');
                console.log(header+'.'+payload+'.'+sig);
              ")

              # Upload theme
              echo "Uploading theme..."
              local response http_code
              response=$(curl -s -w "\n%{http_code}" \
                -X POST \
                "$GHOST_ADMIN_URL/ghost/api/admin/themes/upload" \
                -H "Authorization: Ghost $token" \
                -F "file=@$zip;type=application/zip")
              http_code=$(echo "$response" | tail -1)
              body=$(echo "$response" | head -n -1)

              if [ "$http_code" = "200" ]; then
                echo "Theme uploaded successfully (v$new_ver)."
              else
                echo "Upload failed (HTTP $http_code):"
                echo "$body"
                return 1
              fi
            }

            # Export functions so subshells can see them (bash only; fish users: wrap in funcs)
            export -f ghost-install ghost-up ghost-down ghost-logs gscan _ghost-link-theme ghost-deploy 2>/dev/null || true
          '';
        };
      });
}
