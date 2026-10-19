import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { COVER_PALETTES, type CoverConcept } from './cover'
import type { FlipbookPage } from './ebook-pages'

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 10.5,
    lineHeight: 1.65,
    color: '#1f2937',
  },
  cover: {
    padding: 0,
    justifyContent: 'flex-end',
    backgroundColor: '#0b1019',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    objectFit: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,16,25,0.55)',
  },
  coverContent: {
    padding: 48,
  },
  coverBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 18,
  },
  coverTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 30,
    lineHeight: 1.18,
    color: '#ffffff',
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 11,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 18,
  },
  coverAuthor: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  chapterLabel: {
    fontSize: 8,
    letterSpacing: 1.6,
    color: '#9ca3af',
    marginBottom: 6,
  },
  chapterTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 21,
    lineHeight: 1.2,
    color: '#111827',
    marginBottom: 16,
  },
  heading: {
    fontFamily: 'Times-Roman',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    color: '#111827',
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  quote: {
    marginTop: 6,
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#86efac',
    fontStyle: 'italic',
    color: '#4b5563',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pdfImage: {
    width: '100%',
    marginVertical: 10,
    objectFit: 'contain',
  },
  bullet: {
    width: 12,
    color: '#16a34a',
  },
  tocRow: {
    flexDirection: 'row',
    marginBottom: 7,
  },
  tocNumber: {
    width: 22,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  tocTitle: {
    flex: 1,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8.5,
    color: '#9ca3af',
  },
  flipPage: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    backgroundColor: '#faf8f3',
  },
  flipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
    marginBottom: 14,
  },
  flipHeaderLabel: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: '#9ca3af',
  },
  flipTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 17,
    lineHeight: 1.25,
    color: '#111827',
    marginBottom: 12,
  },
  flipBody: {
    fontSize: 10,
    lineHeight: 1.7,
    color: '#374151',
  },
  flipFooter: {
    position: 'absolute',
    bottom: 22,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    fontSize: 7.5,
    color: '#9ca3af',
  },
  aboutBox: {
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginTop: 12,
  },
})

function renderContent(content: string) {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n{2,}/)

  return blocks.map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)

    if (lines.length === 1) {
      const line = lines[0]
      if (/^#{1,4}\s+/.test(line)) {
        return (
          <Text key={index} style={styles.heading}>
            {line.replace(/^#{1,4}\s+/, '')}
          </Text>
        )
      }
      if (/^>\s?/.test(line)) {
        return (
          <Text key={index} style={styles.quote}>
            {line.replace(/^>\s?/, '')}
          </Text>
        )
      }
      if (/^[-*•]\s+/.test(line)) {
        return (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={{ flex: 1 }}>{line.replace(/^[-*•]\s+/, '')}</Text>
          </View>
        )
      }
      if (/^!\[([^\]]*)\]\(([^)\s]+)\)?$/.test(line)) {
        const match = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)?$/)
        if (match) return <Image key={index} src={match[2]} style={styles.pdfImage} />
      }
      return (
        <Text key={index} style={styles.paragraph}>
          {line}
        </Text>
      )
    }

    // Bloco com várias linhas: títulos, listas, imagens e parágrafos
    return (
      <View key={index}>
        {lines.map((line, lineIndex) => {
          if (/^#{1,4}\s+/.test(line)) {
            return (
              <Text key={lineIndex} style={styles.heading}>
                {line.replace(/^#{1,4}\s+/, '')}
              </Text>
            )
          }
          if (/^>\s?/.test(line)) {
            return (
              <Text key={lineIndex} style={styles.quote}>
                {line.replace(/^>\s?/, '')}
              </Text>
            )
          }
          if (/^[-*•]\s+/.test(line)) {
            return (
              <View key={lineIndex} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={{ flex: 1 }}>{line.replace(/^[-*•]\s+/, '')}</Text>
              </View>
            )
          }
          if (/^!\[([^\]]*)\]\(([^)\s]+)\)?$/.test(line)) {
            const match = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)?$/)
            if (match) return <Image key={lineIndex} src={match[2]} style={styles.pdfImage} />
          }
          return (
            <Text key={lineIndex} style={styles.paragraph}>
              {line}
            </Text>
          )
        })}
      </View>
    )
  })
}

export interface EbookPdfInput {
  title: string
  author: string
  authorBio?: string | null
  promise?: string | null
  chapters: Array<{ order: number; type: string; title: string; content: string }>
  cover?: CoverConcept | null
}

/** PDF editorial: capa, sumário, capítulos e página do autor. */
export function createEbookPDF(input: EbookPdfInput) {
  const chapters = [...input.chapters].sort((a, b) => a.order - b.order)
  const palette = input.cover ? COVER_PALETTES[input.cover.palette] : null
  const coverImage = input.cover?.imageUrl

  return (
    <Document
      title={input.title}
      author={input.author}
      subject={input.promise || undefined}
      creator="Fixly"
    >
      {/* Capa */}
      <Page size="A4" style={styles.cover}>
        {coverImage ? (
          <>
            <Image src={coverImage} style={styles.coverImage} />
            <View style={styles.coverOverlay} />
          </>
        ) : (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: palette?.from || '#16a34a',
            }}
          />
        )}
        <View style={styles.coverContent}>
          {input.cover?.badge && (
            <Text
              style={[
                styles.coverBadge,
                {
                  backgroundColor: palette?.accent || '#bbf7d0',
                  color: palette?.to || '#064e3b',
                },
              ]}
            >
              {input.cover.badge}
            </Text>
          )}
          <Text style={styles.coverTitle}>{input.title}</Text>
          {input.promise && <Text style={styles.coverSubtitle}>{input.promise}</Text>}
          <Text style={styles.coverAuthor}>por {input.author}</Text>
        </View>
      </Page>

      {/* Sumário */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.chapterTitle}>Sumário</Text>
        {chapters.map((chapter) => (
          <View key={chapter.order} style={styles.tocRow}>
            <Text style={styles.tocNumber}>{chapter.order}.</Text>
            <Text style={styles.tocTitle}>{chapter.title}</Text>
          </View>
        ))}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>

      {/* Capítulos */}
      {chapters.map((chapter) => (
        <Page key={chapter.order} size="A4" style={styles.page}>
          <Text style={styles.chapterLabel}>
            {chapter.type === 'appendix' ? 'ANEXO' : `CAPÍTULO ${chapter.order}`}
          </Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          {renderContent(chapter.content || '')}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </Page>
      ))}

      {/* Sobre o autor */}
      <Page size="A4" style={styles.page}>
        <View style={styles.aboutBox}>
          <Text style={styles.chapterLabel}>SOBRE O AUTOR</Text>
          <Text style={styles.chapterTitle}>{input.author}</Text>
          {input.authorBio && <Text style={styles.paragraph}>{input.authorBio}</Text>}
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  )
}

/**
 * PDF no formato flipbook: uma página do PDF por página do flipbook,
 * preservando a ordem e a leitura (capa, sumário e conteúdo).
 */
export function createFlipbookPDF(
  pages: FlipbookPage[],
  meta: { title: string; author: string; cover?: CoverConcept | null }
) {
  const palette = meta.cover ? COVER_PALETTES[meta.cover.palette] : null
  const coverImage = meta.cover?.imageUrl

  return (
    <Document title={meta.title} author={meta.author} creator="Fixly">
      {pages.map((page) => (
        <Page
          key={page.pageNumber}
          size="A4"
          style={page.kind === 'cover' ? styles.cover : styles.flipPage}
          wrap={false}
        >
          {page.kind === 'cover' ? (
            <>
              {coverImage ? (
                <>
                  <Image src={coverImage} style={styles.coverImage} />
                  <View style={styles.coverOverlay} />
                </>
              ) : (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: palette?.from || '#16a34a',
                  }}
                />
              )}
              <View style={styles.coverContent}>
                <Text style={styles.chapterLabel}>FIXLY</Text>
                {meta.cover?.badge && (
                  <Text
                    style={[
                      styles.coverBadge,
                      {
                        backgroundColor: palette?.accent || '#bbf7d0',
                        color: palette?.to || '#064e3b',
                      },
                    ]}
                  >
                    {meta.cover.badge}
                  </Text>
                )}
                <Text style={styles.coverTitle}>{page.title}</Text>
                {page.subtitle && <Text style={styles.coverSubtitle}>{page.subtitle}</Text>}
                <Text style={styles.coverAuthor}>por {meta.author}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.flipHeader}>
                <Text style={styles.flipHeaderLabel}>
                  {page.kind === 'summary' ? 'SUMÁRIO' : `CAPÍTULO ${page.chapterOrder ?? ''}`}
                </Text>
                <Text style={styles.flipHeaderLabel}>{meta.title}</Text>
              </View>

              <Text style={styles.flipTitle}>{page.title}</Text>

              <View style={styles.flipBody}>
                {page.body.map((block, index) => {
                  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
                  return lines.map((line, lineIndex) => {
                    if (/^#{1,4}\s+/.test(line)) {
                      return (
                        <Text key={`${index}-${lineIndex}`} style={styles.heading}>
                          {line.replace(/^#{1,4}\s+/, '')}
                        </Text>
                      )
                    }
                    if (/^[-*•]\s+/.test(line)) {
                      return (
                        <View key={`${index}-${lineIndex}`} style={styles.listItem}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={{ flex: 1 }}>{line.replace(/^[-*•]\s+/, '')}</Text>
                        </View>
                      )
                    }
                    if (/^>\s?/.test(line)) {
                      return (
                        <Text key={`${index}-${lineIndex}`} style={styles.quote}>
                          {line.replace(/^>\s?/, '')}
                        </Text>
                      )
                    }
                    return (
                      <Text key={`${index}-${lineIndex}`} style={{ marginBottom: 7 }}>
                        {line}
                      </Text>
                    )
                  })
                })}
              </View>

              <View style={styles.flipFooter} fixed>
                <Text>{meta.title}</Text>
                <Text>{page.pageNumber}</Text>
              </View>
            </>
          )}
        </Page>
      ))}
    </Document>
  )
}
