import dedent from "dedent";
import compileTemplate from "../src/core/compileTemplate";

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
});
