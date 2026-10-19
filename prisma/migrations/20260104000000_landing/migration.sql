-- AlterTable
ALTER TABLE "LandingConfig" ADD COLUMN     "gallerySubtitle" TEXT NOT NULL DEFAULT 'Capas e páginas criadas com o Fixly.',
ADD COLUMN     "galleryTitle" TEXT NOT NULL DEFAULT 'Feitos na plataforma',
ADD COLUMN     "showGallery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showSocialProof" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "testimonials" JSONB;

