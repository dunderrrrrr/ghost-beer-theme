## Ghost custom theme

For brygglogg.

### Local development

```shell
$ nix develop
$ ghost-install (once)
$ ghost-up
$ cd theme && npm install && npm run dev (css reload)
...
$ ghost-down
```

Add this to `.env`:
```
API_URL=""
CONTENT_API_KEY=""
ADMIN_API_KEY=""
```

#### build zip
```shell
$ cd theme
$ npm run zip
```
