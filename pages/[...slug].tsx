// pages/[...slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next'
import { getPageContent, getAllPages } from '../lib/wiki'
import type { PageContent } from '../lib/wiki'
import Layout from '../components/Layout'
import { getGithubEditUrl } from '../lib/config'
import { useRouter } from 'next/router'
import { useRef, useEffect } from 'react'
import Head from 'next/head'

interface WikiPageProps extends PageContent {
  githubUrl: string
  currentPath: string
}

export default function WikiPage({ content, pages, githubUrl, title, category, lastModified, currentPath }: WikiPageProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!router.isReady) return

    const handleAnchor = () => {
      const hash = window.location.hash
      if (hash && contentRef.current) {
        const id = hash.replace('#', '')
        const element = contentRef.current.querySelector(`#${id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    router.events.on('hashChangeComplete', handleAnchor)
    if (window.location.hash) {
      handleAnchor()
    }

    return () => {
      router.events.off('hashChangeComplete', handleAnchor)
    }
  }, [router.isReady, router.events])

  if (router.isFallback) {
    return (
      <Layout pages={[]} githubUrl="" currentPath="">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout pages={pages} githubUrl={githubUrl} currentPath={currentPath}>
      <Head>
        <title>{title} - Wiki</title>
        <meta name="description" content={`${title} - ${category}`} />
        <meta property="article:modified_time" content={lastModified} />
      </Head>
      <article className="wiki-article">
        <div 
          ref={contentRef}
          className="prose max-w-none" 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </article>
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getAllPages()
  const paths = pages
    .filter(page => page.slug !== '')
    .map(page => ({
      params: { slug: page.slug.split('/') }
    }))

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps<WikiPageProps> = async ({ params }) => {
  const slug = (params?.slug as string[]).join('/')
  const pageContent = await getPageContent(`${slug}.md`)
  const githubUrl = getGithubEditUrl(`${slug}.md`)
  const currentPath = `${slug}.md`

  return {
    props: {
      ...pageContent,
      githubUrl,
      currentPath
    }
  }
}