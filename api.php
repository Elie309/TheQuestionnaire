<?php
// Set headers to allow AJAX requests
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Create uploads directory if it doesn't exist
$uploadsDir = 'uploads';
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Main API router
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list_question_files':
        listQuestionFiles();
        break;
    case 'load_question_file':
        loadQuestionFile();
        break;
    case 'save_question_file':
        saveQuestionFile();
        break;
    case 'upload_image':
        uploadImage();
        break;
    default:
        echo json_encode(['error' => 'Invalid action']);
}

// List all CSV files in the questions directory
function listQuestionFiles() {
    $files = [];
    $dir = 'questions';
    
    if (is_dir($dir)) {
        $csvFiles = glob($dir . '/*.csv');
        
        foreach ($csvFiles as $file) {
            $fileName = basename($file);
            $files[] = [
                'name' => $fileName,
                'path' => $file
            ];
        }
    }
    
    echo json_encode(['files' => $files]);
}

// Load a specific question file
function loadQuestionFile() {
    $fileName = isset($_GET['file']) ? $_GET['file'] : '';
    
    if (empty($fileName)) {
        echo json_encode(['error' => 'No file specified']);
        return;
    }
    
    $filePath = 'questions/' . basename($fileName);
    
    if (!file_exists($filePath)) {
        echo json_encode(['error' => 'File not found']);
        return;
    }
    
    $csvContent = file_get_contents($filePath);
    echo json_encode(['content' => $csvContent]);
}

// Save a question set
function saveQuestionFile() {
    // Get JSON data from POST request
    $postData = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($postData['fileName']) || !isset($postData['csvContent'])) {
        echo json_encode(['error' => 'Missing required data']);
        return;
    }
    
    $fileName = basename($postData['fileName']); // Sanitize filename
    
    // Check if it's a CSV file
    if (!preg_match('/\.csv$/', $fileName)) {
        $fileName .= '.csv';
    }
    
    $filePath = 'questions/' . $fileName;
    
    // Create questions directory if it doesn't exist
    if (!file_exists('questions')) {
        mkdir('questions', 0755, true);
    }
    
    // Save the CSV content
    $result = file_put_contents($filePath, $postData['csvContent']);
    
    if ($result !== false) {
        echo json_encode(['success' => true, 'message' => 'File saved successfully']);
    } else {
        echo json_encode(['error' => 'Failed to save file']);
    }
}

// Handle image uploads
function uploadImage() {
    $response = ['success' => false];
    
    if (!isset($_FILES['image'])) {
        $response['error'] = 'No image uploaded';
        echo json_encode($response);
        return;
    }
    
    $file = $_FILES['image'];
    
    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $response['error'] = 'Upload error: ' . $file['error'];
        echo json_encode($response);
        return;
    }
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        $response['error'] = 'Invalid file type. Only JPG, PNG and GIF are allowed.';
        echo json_encode($response);
        return;
    }
    
    // Generate a unique filename
    $uniqueId = 'img_' . bin2hex(random_bytes(8)) . '_' . time();
    $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = $uniqueId . '.' . $fileExt;
    
    // Full path to save the file
    $targetPath = 'uploads/' . $fileName;
    
    // Make sure images directory exists
    if (!file_exists('uploads')) {
        mkdir('uploads', 0755, true);
    }
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $response['success'] = true;
        $response['fileName'] = $fileName;
        $response['path'] = $targetPath;
    } else {
        $response['error'] = 'Failed to save the uploaded file';
    }
    
    echo json_encode($response);
}
?>
