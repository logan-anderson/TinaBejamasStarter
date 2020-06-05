import matter from "gray-matter"
import algoliasearch from "algoliasearch/lite"
import { useRouter } from "next/router"
import Error from "next/error"
import { useFormScreenPlugin, usePlugin } from "tinacms"
import { InlineTextField, InlineField } from "react-tinacms-inline"
import { InlineWysiwyg, Wysiwyg } from "react-tinacms-editor"
import { getGithubPreviewProps, parseMarkdown, parseJson } from "next-tinacms-github"
import { InlineForm } from "react-tinacms-inline"

import Head from "@components/head"
import InlineEditingControls from "@components/inline-controls"
import Layout from "@components/layout"
import PostNavigation from "@components/post-navigation"
import PostFeedback from "@components/post-feedback"
import SideNav from "@components/side-nav"
import DocWrapper from "@components/doc-wrapper"
import MarkdownWrapper from "@components/markdown-wrapper"
import Toc from "@components/Toc"
import {
  useCreateMainDoc,
  useFormEditDoc,
  useCreateChildPage,
  useNavigationForm,
  useGlobalStyleForm,
} from "@hooks"
import { createToc } from "@utils"
import getGlobalStaticProps from "../../utils/getGlobalStaticProps"

const DocTemplate = (props) => {
  const router = useRouter()
  if (!props.file) {
    return <Error statusCode={404} />
  }

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  const [data, form] = useFormEditDoc(props.file)
  usePlugin(form)
  const [navData, navForm] = useNavigationForm(props.navigation, props.preview)
  const nestedDocs = navData.config
  const [styleData] = useGlobalStyleForm(props.styleFile, props.preview)

  useFormScreenPlugin(navForm)
  // wrappers around using the content-creator puglin with tinaCMS
  useCreateMainDoc(nestedDocs)
  useCreateChildPage(nestedDocs)

  return (
    <Layout showDocsSearcher splitView preview={props.preview} theme={styleData}>
      <Head title={data.frontmatter.title} />
      <SideNav
        allNestedDocs={nestedDocs}
        currentSlug={router.query.slug}
        // This will have to change to JSON
        groupIn={data.frontmatter.groupIn}
      />
      <InlineForm form={form}>
        <DocWrapper preview={props.preview} styled={true}>
          {props.preview && <InlineEditingControls />}
          <main>
            <h1>
              <InlineTextField name="frontmatter.title" />
            </h1>
            {!props.preview && props.Alltocs.length > 0 && <Toc tocItems={props.Alltocs} />}

            <InlineWysiwyg
              // TODO: fix this
              // imageProps={{
              //   async upload(files) {
              //     const directory = "/public/images/"

              //     let media = await cms.media.store.persist(
              //       files.map((file) => {
              //         return {
              //           directory,
              //           file,
              //         }
              //       })
              //     )
              //     return media.map((m) => `/images/${m.filename}`)
              //   },
              //   previewUrl: (str) => str,
              // }}
              name="markdownBody"
            >
              <MarkdownWrapper source={data.markdownBody} />
            </InlineWysiwyg>
          </main>
          <PostNavigation allNestedDocs={nestedDocs} />
          <PostFeedback />
        </DocWrapper>
      </InlineForm>
    </Layout>
  )
}

// read more about getStaticProps, getStaticPaths and previewMode (its pretty cool stuff)
// https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation

export const getStaticProps = async function ({ preview, previewData, params }) {
  const global = await getGlobalStaticProps(preview, previewData)
  const { slug } = params
  const fileRelativePath = `docs/${slug.join("/")}.md`

  // we need these to be in scope for the catch statment
  let previewProps
  let allNestedDocsRemote
  let Alltocs = ""
  // if we are in preview mode we will get the contents from github
  if (preview) {
    try {
      previewProps = await getGithubPreviewProps({
        ...previewData,
        fileRelativePath,
        parse: parseMarkdown,
      })
      allNestedDocsRemote = await getGithubPreviewProps({
        ...previewData,
        fileRelativePath: "docs/config.json",
        parse: parseJson,
      })

      if (typeof window === "undefined") {
        Alltocs = createToc(previewProps.props.file.data.markdownBody)
      }
      return {
        props: {
          ...global,
          // markdown file stored in file:
          ...previewProps.props,
          // json for navigation form
          navigation: {
            ...allNestedDocsRemote.props.file,
            fileRelativePath: `docs/config.json`,
          },
          Alltocs,
        },
      }
    } catch (e) {
      // return the erros from gitGithubPreviewProps
      return {
        props: {
          ...previewProps.props,
          ...allNestedDocsRemote.props,
        },
      }
    }
  }

  // Not in preview mode so we will get contents from the file system
  const allNestedDocs = require("../../docs/config.json")
  const content = await import(`@docs/${slug.join("/")}.md`)
  const data = matter(content.default)

  // Create Toc (table of contents)
  if (typeof window === "undefined") {
    Alltocs = createToc(data.content)
  }

  return {
    props: {
      // the markdown file
      ...global,
      file: {
        fileRelativePath: `docs/${slug.join("/")}.md`,
        data: {
          frontmatter: data.data,
          markdownBody: data.content,
        },
      },
      navigation: {
        fileRelativePath: `docs/config.json`,
        data: allNestedDocs,
      },
      Alltocs,
      preview: false,
      error: null,
    },
  }
}

export const getStaticPaths = async function () {
  const fg = require("fast-glob")
  const contentDir = "docs/"
  const files = await fg(`${contentDir}**/*.md`)
  return {
    fallback: true,
    paths: files
      // .filter(file => !file.endsWith('index.md'))
      .map((file) => {
        const path = file.substring(contentDir.length, file.length - 3)
        return { params: { slug: path.split("/") } }
      }),
  }
}

export default DocTemplate
