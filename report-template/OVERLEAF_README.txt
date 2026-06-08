# AI Conquer 2026 LaTeX Template

This package is designed for use on Overleaf. The easiest way to get started is to import the whole `.zip` file directly into a new Overleaf project.

## How to import the ZIP file into Overleaf

1. Go to Overleaf.
2. Click **New Project**.
3. Choose **Upload Project**.
4. Select the provided `.zip` file.
5. Wait for Overleaf to extract and upload all files automatically.

After the upload is complete, your project should contain the following main files and folders:

- `Figures/`: stores images and visual assets used in the document.
- `Templates/`: stores the report templates you can start from.
- `ai_conquer2026.cls`: the main class file of the template.
- `guide.tex`: the user guide for this template package.
- `references.bib`: the bibliography database for references.
- `tvietlistings`: support file for Vietnamese-friendly listings.
- `vipythonhighlight`: support file for Python code highlighting.

## Recommended workflow

After importing the project, open the `Templates/` folder and choose the template that matches your document type. You can either edit that file directly or create a new working file based on it.

A simple workflow is:

1. Open the `Templates/` folder.
2. Select the template you want to use.
3. Create your own working file or duplicate the template file.
4. Start editing the content.
5. Keep all figures inside the `Figures/` folder so paths remain organized.
6. Add your references to `references.bib` when needed.

## Notes

- Do not remove `ai_conquer2026.cls`, since the document depends on it.
- Keep the folder structure unchanged unless you also update the file paths in your `.tex` files.
- If your template file is not compiled by default, set it as the **Main File** in Overleaf before compiling.

## Quick start

If you are new to this package, read `guide.tex` first for instructions and formatting rules. Then open a file inside `Templates/`, replace the sample content with your own, and compile the project on Overleaf.