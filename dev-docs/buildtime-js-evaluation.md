### Build Time JavaScript Evaluation

In Statyk we have can evaluate javascript in build time and the template will be generated.

Currently we have interpolated expressions

```html
<div>{{props.myMsg}}</div>
<div>{{1 + 1}}</div>
<div>
  {{map([1, 2, 3], (v) => `
  <p>${v}</p>
  `)}}
</div>
```

#### Execution context

Currently we parsing the props and stringifying them and appending them when running the codeblock with vm2

Generated code string looks like this:

```
let props = { ...props... }

module.exports = ...
```

Although this works, it's not optimal, it's buggy and error prone.
Instead we can use the vm2 context to directly pass the variables and run the code with the sandbox context.

#### Frontmatter script

We are planning to add frontmatter script which will look something like this:

```html
---
// supports async
const hello = await fetch();
---

<p>Lets use hello: {{data.hello}}</p>
```

This would mean we will need a more robust way to execute the build time codeblocks.
So with the addition of frontmatter scripts, the inline expressions have to have the context of the code which ran on frontmatter plus the props.

We need a unified codeblock runner which will get the props from the components and put that on the `props` variable which should be available on both the frontmatter script and the inline expressions,
so that the frontmatter script can get external props and render depending on the props.
Take for example:

```html
<!-- index.html -->
<include src="partials/user.html" username="anuraghazra" />
<include src="partials/user.html" username="kentcdodds" />

<!-- partials/user.html -->
--- 
// fetch some data
const githubUser = await fetch(`https://someurl.com/${props.username}`) 
--- 

<p>{{githubUser.name}}</p>
<p>{{githubUser.bio}}</p>
```

##### Expression runner

It will run the expression with both `props` & the `frontmatterVars` context;
Thus we could access props like `props.myMsg` & any frontmatter variables

```js
const vars = merge({ props }, frontmatterVars);
runExpression(code, vars);
```

##### Frontmatter runner

The frontmatter runner would need the context of the passed props thus it can look something like: 

```js

const vars = merge(passedProps, include.attributes);
runFrontmatter(code, vars)

```

