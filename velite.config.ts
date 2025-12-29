import rehypePrettyCode from "rehype-pretty-code";
import { defineCollection, defineConfig, s } from "velite";

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(100),
      slug: s.slug("blog"),
      description: s.string().max(300),
      date: s.isodate(),
      published: s.boolean().default(true),
      author: s.string().default("ShipSaaS Team"),
      tags: s.array(s.string()).default([]),
      image: s.string().optional(),
      body: s.mdx(),
    })
    .transform((data) => ({
      ...data,
      permalink: `/blog/${data.slug}`,
      readingTime: Math.ceil(data.body.split(/\s+/).length / 200),
    })),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: "github-dark-dimmed",
          keepBackground: true,
        },
      ],
    ],
  },
});
