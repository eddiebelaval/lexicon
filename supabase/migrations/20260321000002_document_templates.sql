-- Document Templates
-- Stores production document templates (.docx, .html, .txt) that Lexi can fill with production data.
-- Templates have {{placeholder}} variables that get replaced with real values.

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content TEXT,
  source_format TEXT NOT NULL DEFAULT 'html' CHECK (source_format IN ('docx', 'pdf', 'html', 'text')),
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN (
    'call_sheet', 'contract', 'memo', 'report', 'checklist', 'release_form', 'custom'
  )),
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_template_slug UNIQUE (production_id, slug)
);

CREATE INDEX idx_templates_production ON document_templates(production_id);
CREATE INDEX idx_templates_category ON document_templates(category);

-- RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select" ON document_templates FOR SELECT USING (true);
CREATE POLICY "templates_insert" ON document_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "templates_update" ON document_templates FOR UPDATE USING (true);
CREATE POLICY "templates_delete" ON document_templates FOR DELETE USING (true);
