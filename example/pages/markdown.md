<include src="partials/layout.html">

  #### Look ma, direct markdown

  <include
    src="partials/card.html"
    title="We can use includes directly in markdown"
    desc="Thats cool"
    linkHref="#"
    linkText="yey!"
  />

  - Thats [cool](https://anuraghazra.dev)

  ```ts
    const code: string = ''
  ```

  #### Interactive counter, Client side components 
  
  Supports multiple components with different props

  - start at 5, with step 10
  - <include src="partials/counter.html" count="5" step="10" />

  - start at 10, with step 100
  - <include src="partials/counter.html" count="10" step="100" />

  {{
    map(["anuraghazra", "saurabhdaware", "HarshKapadia2"], 
    (username) => {
      return `
        <include 
          src="partials/github-user.html" 
          username="${username}" 
        >
      `
    })
  }}

</include>