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

            # Export functions so subshells can see them (bash only; fish users: wrap in funcs)
            export -f ghost-install ghost-up ghost-down ghost-logs gscan _ghost-link-theme 2>/dev/null || true
          '';
        };
      });
}
