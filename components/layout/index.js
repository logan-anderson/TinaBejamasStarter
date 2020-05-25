import { node, bool } from "prop-types"
import { useEffect } from "react"
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

  let file = require("../../content/styles.json")

  useEffect(() => {
    async function fetchData() {
      const res = await cms.api.github.fetchFile("content/styles.json")
      return JSON.parse(res.decodedContent)
    }
    if (preview) {
      file = fetchData()
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
    ],
  }
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
