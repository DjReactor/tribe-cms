import fs from 'fs';
import path from 'path';

export interface TemplateRegistryManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  preview_image: string;
  tags: string[];
  supports?: string[];
}

export function getTemplateManifests(): TemplateRegistryManifest[] {
  const templatesDir = path.join(process.cwd(), 'src', 'templates');
  
  if (!fs.existsSync(templatesDir)) return [];

  const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const manifests: TemplateRegistryManifest[] = [];

  for (const dirName of templateDirs) {
    const manifestPath = path.join(templatesDir, dirName, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const fileContents = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(fileContents);
        manifests.push(manifest);
      } catch (e) {
        console.error(`Failed to parse manifest for template ${dirName}:`, e);
      }
    }
  }

  return manifests;
}

export function getTemplateManifest(id: string): TemplateRegistryManifest | null {
  const manifests = getTemplateManifests();
  return manifests.find(m => m.id === id) || null;
}
