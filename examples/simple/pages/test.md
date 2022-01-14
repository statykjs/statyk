<include src="partials/layout.html">

  ## Hello world

  {{
    map(["anuraghazra", "saurabhdaware", "HarshKapadia2"], 
    (username) => {
      return `
        <include src="partials/avatar.html" username="${username}" />
      `
    })
  }}
</include>