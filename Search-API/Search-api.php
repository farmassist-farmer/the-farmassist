<?php
// search-api.php - Backend endpoint for search functionality

// Allow CORS if needed
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Get request data
$data = json_decode(file_get_contents("php://input"));

// Check if search query was provided
if(!isset($data->query) || empty($data->query)) {
    http_response_code(400);
    echo json_encode(["message" => "Search query is required"]);
    exit;
}

// Connect to database
$servername = "localhost";
$username = "your_username";
$password = "your_password";
$dbname = "agricultural_website";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Build query based on filters
    $query = $data->query;
    $types = isset($data->filters->types) ? $data->filters->types : [];
    $category = isset($data->filters->category) ? $data->filters->category : '';
    
    // Base SQL query
    $sql = "SELECT * FROM content WHERE 
            (title LIKE :search OR description LIKE :search OR content LIKE :search)";
    
    // Add type filter if specified
    if (!empty($types)) {
        $typeParams = [];
        $i = 0;
        foreach ($types as $type) {
            $typeParams[":type$i"] = $type;
            $i++;
        }
        $typeIn = implode(',', array_keys($typeParams));
        $sql .= " AND type IN ($typeIn)";
    }
    
    // Add category filter if specified
    if (!empty($category)) {
        $sql .= " AND category = :category";
    }
    
    // Prepare and execute query
    $stmt = $conn->prepare($sql);
    
    // Bind parameters
    $searchParam = "%$query%";
    $stmt->bindParam(":search", $searchParam);
    
    // Bind type parameters if they exist
    if (!empty($typeParams)) {
        foreach ($typeParams as $key => $value) {
            $stmt->bindParam($key, $value);
        }
    }
    
    // Bind category parameter if it exists
    if (!empty($category)) {
        $stmt->bindParam(":category", $category);
    }
    
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return results
    http_response_code(200);
    echo json_encode(["results" => $results]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
