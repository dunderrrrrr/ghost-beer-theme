## Ghost custom theme

Theme for brygglogg, based of the Ruby default theme but modified af.

### Local development

```shell
$ nix develop
$ ghost-install (once)
$ ghost-up # start local ghost instance
$ cd theme && npm install && npm run dev (css reload)
...
$ ghost-down # stop local ghost instance
$ ghost-deploy # uploads theme to prod ghost instance
```

Add this to `.env`:
```
API_URL=""
CONTENT_API_KEY="" 
ADMIN_API_KEY=""
```
