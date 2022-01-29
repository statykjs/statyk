import dedent from "dedent";
import compileTemplate from "../src/core/compileTemplate";

jest.mock("shortid", () => {
  let count = 0
  return { generate: jest.fn(() => {
    count++;
    return count;
  }) };
});

describe("compileTemplate", () => {
  it("should render html", async () => {
    const html = `<p>{{props.msg}}</p>`;

    const res = await compileTemplate(html, "./", { msg: "hello" });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with props", async () => {
    const html = `<p>{{props.count}}: <p>{{props.count + 1}}</p>`;

    const res = await compileTemplate(html, "./", { count: 1 });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render global context values", async () => {
    const html = `<p>{{name}}</p>`;

    const res = await compileTemplate(html, "./", {}, { name: "Anurag" });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with frontmatter yml", async () => {
    const html = dedent`
      ---yml
      name: anuraghazra
      foods: 
        - apple
        - mango
      ---
      <p>{{name}}</p>
      <div>{{map(foods, (food) => '<p>'+food+'</p>')}}</div>
    `;

    const res = await compileTemplate(html, "./");
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with frontmatter js code", async () => {
    const html = dedent`
      ---
      const count = 10;
      return { count };
      ---
      <p>{{count + props.add}}</p>
    `;

    const res = await compileTemplate(html, "./", { add: 1 });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with include", async () => {
    const html = dedent`
      <include src="fixtures/test.html" data="{{props.data}}" />
    `;

    const res = await compileTemplate(html, "./tests", { data: 1 });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with nested includes", async () => {
    const html = dedent`
      <include src="fixtures/nested-1.html" root="{{props.msg}}" />
    `;

    const res = await compileTemplate(html, "./tests", { msg: "root" });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with multiple includes", async () => {
    const html = dedent`
      <include src="fixtures/test.html" data="{{parseInt(props.data)+1}}" />
      <include src="fixtures/test.html" data="{{parseInt(props.data)+2}}" />
    `;

    const res = await compileTemplate(html, "./tests", { data: 1 });
    expect(res.innerHTML).toMatchSnapshot();
  });

  test("frontmatter codeblock should take props", async () => {
    const html = dedent`
      ---
      const url: string = 'https://nice.com/' + props.username;
      return { url };
      ---
      <p>{{url}}</p>
    `;

    const res = await compileTemplate(html, "./tests", {
      username: "anuraghazra",
    });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with partials containing frontmatter codeblock", async () => {
    const html = dedent`
    ---yml
    count: 1
    ---
    <include src="fixtures/frontmatter-code.html" username="{{props.username + '/' + count}}" />
    `;

    const res = await compileTemplate(html, "./tests", {
      username: "anuraghazra",
    });
    expect(res.innerHTML).toMatchSnapshot();
  });

  it("should render with markdown", async () => {
    const html = dedent`
      ### Hello {{props.msg}}
    `;

    const res = await compileTemplate(html, "./tests", { msg: "Anurag" });
    expect(res.innerHTML).toMatchSnapshot();
  });

  test("reusable js components should work", async () => {
    const html = dedent`
      <body>
        <include src="fixtures/counter.html" step={{5}} count={{1}} />
        <include src="fixtures/counter.html" step={{10}} count={{2}} />
      </body>
    `;

    const res = await compileTemplate(html, "./tests", {});
    expect(res.innerHTML).toMatchSnapshot();
  });
});
