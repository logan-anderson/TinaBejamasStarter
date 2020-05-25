import { node, bool } from "prop-types"
import { useEffect, useState } from "react"
import { InlineForm } from "react-tinacms-inline"
import { useGithubToolbarPlugins, useGithubJsonForm } from "react-tinacms-github"
import { ThemeProvider } from "styled-components"
import { getGithubPreviewProps, parseJson } from "next-tinacms-github"

import getTheme from "../../utils/theme"
import TopBar from "@components/topbar"
import { useCMS } from "tinacms"
import Footer from "@components/footer"

import { LayoutStyled, LayoutBodyStyled } from "./styles"

const Layout = ({ children, showDocsSearcher, splitView, preview, form }) => {
  useGithubToolbarPlugins()
  const cms = useCMS()

  let [file, setFile] = useState({ data: require("../../content/styles.json") })

  useEffect(() => {
    if (preview) {
      console.log("file being updated")
      cms.api.github.fetchFile("content/styles.json", null).then((response) => {
        setFile({
          sha: response.sha,
          fileRelativePath: "content/styles.json",
          data: JSON.parse(response.decodedContent || ""),
        })
      })
      // setFile({
      //   sha: null,
      //   fileRelativePath: "content/styles.json",
      //   data: require("../../content/styles.json")
      // })
    }
  }, [preview])

  const formOptions = {
    label: "styles",
    fields: [
      {
        name: "logo",
        component: "text",
      },
      {
        name: "siteName",
        component: "text",
      },
      {
        name: "description",
        component: "text",
      },
      {
        name: "title",
        component: "text",
      },
    ],
  }

  console.log(file)
  const [data, stylesForm] = useGithubJsonForm(file, formOptions)

  const currentTheme = getTheme(preview)

  return (
    <ThemeProvider theme={currentTheme}>
      <LayoutStyled>
        <TopBar showDocsSearcher={showDocsSearcher} theme={currentTheme} />
        <LayoutBodyStyled splitView={splitView}>
          {form ? <InlineForm form={form}>{children}</InlineForm> : children}
        </LayoutBodyStyled>
        <Footer preview={preview} />
      </LayoutStyled>
    </ThemeProvider>
  )
}

Layout.propTypes = {
  children: node,
  showDocsSearcher: bool,
  splitView: bool,
}

Layout.defaultProps = {
  showDocsSearcher: false,
  splitView: false,
}

export default Layout
