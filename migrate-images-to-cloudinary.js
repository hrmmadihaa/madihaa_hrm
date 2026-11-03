import fs from 'fs';
import path from 'path';

const CLOUD_NAME = 'dxcj44eln';
const UPLOAD_PRESET = 'delivery-hub';
const EMPLOYEE_IMAGES_DIR = './public/employee_images';

// Upload image to Cloudinary
async function uploadToCloudinary(filePath, employeeId) {
  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  
  formData.append('file', new Blob([fileBuffer]), path.basename(filePath));
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'employee_images');
  formData.append('public_id', `employee_images/${employeeId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.secure_url;
}

// Main migration function
async function migrateImages() {
  console.log('=== Starting image migration to Cloudinary ===\n');

  // Get all local images
  const imageFiles = fs.readdirSync(EMPLOYEE_IMAGES_DIR)
    .filter(file => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/.test(file))
    .filter(file => file !== 'Thumbs.db' && file !== 'LOGO.png' && file !== 'letter head.png' && file !== 'cp.jpg' && file !== 'MD.jpg');

  console.log(`Found ${imageFiles.length} local images to migrate\n`);

  const mappings = {};
  let successCount = 0;
  let failCount = 0;

  for (const imageFile of imageFiles) {
    const employeeId = path.basename(imageFile, path.extname(imageFile));
    const imagePath = path.join(EMPLOYEE_IMAGES_DIR, imageFile);

    try {
      console.log(`Uploading ${imageFile} for employee ${employeeId}...`);
      const cloudinaryUrl = await uploadToCloudinary(imagePath, employeeId);
      
      mappings[employeeId] = cloudinaryUrl;
      console.log(`✓ Successfully uploaded ${employeeId}`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed to upload ${employeeId}:`, error.message);
      failCount++;
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Successfully uploaded: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${imageFiles.length}`);

  // Save mappings to JSON file
  fs.writeFileSync('./cloudinary-mappings.json', JSON.stringify(mappings, null, 2));
  console.log('\nMappings saved to cloudinary-mappings.json');
  console.log('You can now use this file to update Firestore employee records.');
}

// Run migration
migrateImages()
  .then(() => {
    console.log('\nMigration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
