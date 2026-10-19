import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (using system fonts for now)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/interpress/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  cover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    color: 'white',
    padding: 40,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  coverAuthor: {
    fontSize: 16,
    opacity: 0.9,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#16a34a',
  },
  heading: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 8,
  },
  listItem: {
    marginBottom: 4,
    paddingLeft: 16,
  },
  table: {
    marginVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  aboutAuthor: {
    padding: 20,
    backgroundColor: '#f9fafb',
    marginTop: 20,
  },
  aboutAuthorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tocItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tocNumber: {
    width: 30,
    fontWeight: 'bold',
  },
  tocTitle: {
    flex: 1,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
  },
})

export interface PDFChapter {
  order: number
  type: 'chapter' | 'appendix'
  title: string
  content: string
}

export interface PDFProfile {
  name: string
  bio: string
  photoUrl?: string
  brandColor: string
}

export function createEbookPDF(title: string, chapters: PDFChapter[], profile: PDFProfile) {
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={styles.cover}>
        <Text style={styles.coverTitle}>{title}</Text>
        <Text style={styles.coverAuthor}>por {profile.name}</Text>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.chapterTitle}>Sumário</Text>
        {sortedChapters.map((ch) => (
          <View key={ch.order} style={styles.tocItem}>
            <Text style={styles.tocNumber}>{ch.order}.</Text>
            <Text style={styles.tocTitle}>{ch.title}</Text>
          </View>
        ))}
      </Page>

      {/* Chapters */}
      {sortedChapters.map((chapter) => (
        <Page key={chapter.order} size="A4" style={styles.page}>
          <Text style={styles.chapterTitle}>
            {chapter.type === 'appendix' ? 'Anexo' : `Capítulo ${chapter.order}`}
          </Text>
          <Text style={styles.heading}>{chapter.title}</Text>
          {chapter.content.split('\n').map((paragraph, idx) => (
            <Text key={idx} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Page>
      ))}

      {/* About the Author */}
      <Page size="A4" style={styles.page}>
        <View style={styles.aboutAuthor}>
          <Text style={styles.aboutAuthorTitle}>Sobre o autor</Text>
          <Text style={styles.paragraph}>{profile.bio}</Text>
        </View>
      </Page>
    </Document>
  )
}
