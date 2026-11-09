import os
import shutil
import zipfile

base_dir = r'C:\Users\YewonPark\.gemini\antigravity\scratch\ar_archery'
dist_dir = os.path.join(base_dir, 'dist')
zip_path = os.path.join(base_dir, 'hubaekje_ar_archery_netlify.zip')

# Re-create dist directory
if os.path.exists(dist_dir):
    shutil.rmtree(dist_dir)
os.makedirs(dist_dir, exist_ok=True)

# Copy files & directories
files_to_copy = [
    'index.html',
    'badge_gyeonhwon.png',
    'three.min.js',
    'qrcode.min.js'
]

for f in files_to_copy:
    src = os.path.join(base_dir, f)
    dst = os.path.join(dist_dir, f)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Copied {f} to dist")

# Copy css, js and assets folders (ignoring original backups)
def ignore_patterns(path, names):
    return [n for n in names if 'original' in n or n.endswith('.bak')]

for folder in ['css', 'js', 'assets']:
    src_folder = os.path.join(base_dir, folder)
    dst_folder = os.path.join(dist_dir, folder)
    if os.path.exists(src_folder):
        shutil.copytree(src_folder, dst_folder, ignore=ignore_patterns)
        print(f"Copied {folder}/ to dist")

# Create clean zip for Netlify Drop
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dist_dir)
            zipf.write(full_path, rel_path)

print(f"\nSuccessfully created clean Netlify bundle:")
print(f"Dist directory: {dist_dir}")
print(f"Netlify Zip package: {zip_path} ({os.path.getsize(zip_path):,} bytes)")
