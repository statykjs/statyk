## Basic overview of plugins

### What can a plugin should be able to do? 

There will be 2 types of plugins

- Source plugins (fetch data from external source)
- Transform plugins (transform html contents)

For now we want these hooks

- build hooks
- page creation hooks
- miscellaneous hooks

```ts
// runs after/before build
beforeBuild: () => {}
afterBuild: () => {}

// runs for each page creation call
beforeCreatePage: () => {}
afterCreatepage: () => {}

// runs while copying static folder (not priorty rn)
beforeStaticCopy() => {}
afterStaticCopy() => {}
```


