<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$host = 'localhost';
$db   = 'mapofinterest';
$user = 'mapofinterest';
$pass = 'cedric';
$dsn = "pgsql:host=$host;dbname=$db";
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];

// Handle POI submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['name'], $_POST['category'], $_POST['latitude'], $_POST['longitude'], $_POST['description'])) {
    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        $stmt = $pdo->prepare('INSERT INTO points_of_interest (name, category_id, latitude, longitude, description, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
        $stmt->execute([
            $_POST['name'],
            $_POST['category'],
            $_POST['latitude'],
            $_POST['longitude'],
            $_POST['description'],
            $_SESSION['user_id']
        ]);
        header('Location: dashboard.php');
        exit;
    } catch (PDOException $e) {
        $add_poi_error = 'Failed to add POI: ' . htmlspecialchars($e->getMessage());
    }
}

$pois = [];
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $poiStmt = $pdo->query('SELECT p.*, c.name AS category, u.username AS user FROM points_of_interest p JOIN categories c ON p.category_id = c.id JOIN users u ON p.user_id = u.id');
    $pois = $poiStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Handle DB error gracefully
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Map of Interest</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        html, body, .full-height { height: 100%; margin: 0; padding: 0; }
        body, .container-fluid, .row.full-height, .left-pane, .right-pane { height: 100vh !important; min-height: 100vh; }
        #main-row { height: 100vh; }
        #map { height: 100vh; width: 100%; min-height: 400px; min-width: 200px; background: #eaeaea; border: 3px solid red; }
        .left-pane { height: 100%; border-right: 1px solid #ddd; display: flex; flex-direction: column; padding: 0 !important; }
        .right-pane { height: 100%; overflow-y: auto; }
    </style>
</head>
<body class="bg-light full-height">
<div class="container-fluid full-height">
    <div class="row full-height" id="main-row">
        <div class="col-xxl-10 col-xl-9 col-lg-8 col-md-8 col-sm-12 left-pane p-0">
            <div id="map">Loading map...</div>
        </div>
        <div class="col-xxl-2 col-xl-3 col-lg-4 col-md-4 col-sm-12 right-pane bg-white p-3">
            <h5>Filters</h5>
            <form id="filter-form" class="mb-3">
                <div class="mb-2">
                    <label for="category-filter" class="form-label">Category</label>
                    <select id="category-filter" class="form-select">
                        <option value="">All Categories</option>
                        <?php
                        try {
                            $catStmt = $pdo->query('SELECT id, name FROM categories ORDER BY name');
                            while ($cat = $catStmt->fetch(PDO::FETCH_ASSOC)) {
                                echo '<option value="' . htmlspecialchars($cat['name']) . '">' . htmlspecialchars($cat['name']) . '</option>';
                            }
                        } catch (PDOException $e) {}
                        ?>
                    </select>
                </div>
                <div class="mb-2">
                    <label for="search-filter" class="form-label">Search</label>
                    <input type="text" id="search-filter" class="form-control" placeholder="Name or description...">
                </div>
            </form>
            <button class="btn btn-primary w-100 mb-3" id="show-poi-modal-btn" type="button" data-bs-toggle="modal" data-bs-target="#addPoiModal">Add Point of Interest</button>
            <!-- Modal for Add POI -->
            <div class="modal fade" id="addPoiModal" tabindex="-1" aria-labelledby="addPoiModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="addPoiModalLabel">Add Point of Interest</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <form id="add-poi-form" method="post" autocomplete="off">
                    <div class="modal-body">
                      <?php if (!empty($add_poi_error)): ?>
                        <div class="alert alert-danger"><?php echo $add_poi_error; ?></div>
                      <?php endif; ?>
                      <div class="mb-2">
                        <label for="poi-name" class="form-label">Name</label>
                        <input type="text" id="poi-name" name="name" class="form-control" required>
                      </div>
                      <div class="mb-2">
                        <label for="poi-category" class="form-label">Category</label>
                        <select id="poi-category" name="category" class="form-select" required>
                          <option value="">Select Category</option>
                          <?php
                          try {
                              $catStmt = $pdo->query('SELECT id, name FROM categories ORDER BY name');
                              while ($cat = $catStmt->fetch(PDO::FETCH_ASSOC)) {
                                  echo '<option value="' . htmlspecialchars($cat['id']) . '">' . htmlspecialchars($cat['name']) . '</option>';
                              }
                          } catch (PDOException $e) {}
                          ?>
                        </select>
                      </div>
                      <div class="mb-2">
                        <label for="poi-lat" class="form-label">Latitude</label>
                        <input type="number" step="any" id="poi-lat" name="latitude" class="form-control" required>
                      </div>
                      <div class="mb-2">
                        <label for="poi-lon" class="form-label">Longitude</label>
                        <input type="number" step="any" id="poi-lon" name="longitude" class="form-control" required>
                      </div>
                      <div class="mb-2">
                        <label for="poi-desc" class="form-label">Description</label>
                        <textarea id="poi-desc" name="description" class="form-control" rows="2" required></textarea>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                      <button type="submit" class="btn btn-success">Submit</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <h5>Point of Interest Metadata</h5>
            <div id="poi-metadata">
                <p>Select a marker on the map to view details.</p>
            </div>
        </div>
    </div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
const pois = <?php echo json_encode($pois); ?>;
let map;
let markers = [];

function renderPOIs(filteredPOIs) {
    const container = document.getElementById('poi-metadata');
    if (!filteredPOIs.length) {
        container.innerHTML = '<p>No POIs match your filters.</p>';
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        return;
    }
    container.innerHTML = '<ul class="list-group">' +
        filteredPOIs.map(poi => '<li class="list-group-item">' +
            '<strong>' + poi.name + '</strong><br>' +
            '<span>' + poi.category + '</span><br>' +
            '<span>' + poi.description + '</span>' +
        '</li>').join('') + '</ul>';
    // Update map markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    filteredPOIs.forEach(function(poi) {
        let marker = L.marker([poi.latitude, poi.longitude]).addTo(map);
        marker.on('click', function() {
            container.innerHTML =
                '<h6>' + poi.name + '</h6>' +
                '<p><strong>Category:</strong> ' + poi.category + '</p>' +
                '<p><strong>Description:</strong> ' + poi.description + '</p>' +
                '<p><strong>Added by:</strong> ' + poi.user + '</p>' +
                '<p><strong>Created at:</strong> ' + poi.created_at + '</p>';
        });
        markers.push(marker);
    });
}

function filterPOIs() {
    const cat = document.getElementById('category-filter').value.trim();
    const search = document.getElementById('search-filter').value.trim().toLowerCase();
    let filtered = pois;
    if (cat) filtered = filtered.filter(poi => poi.category === cat);
    if (search) filtered = filtered.filter(poi => (poi.name + ' ' + poi.description).toLowerCase().includes(search));
    renderPOIs(filtered);
}

document.addEventListener('DOMContentLoaded', function() {
    // Ensure map container fills parent
    var mapDiv = document.getElementById('map');
    mapDiv.style.height = mapDiv.parentElement.offsetHeight + 'px';
    map = L.map('map').setView([48.858844, 2.294351], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    renderPOIs(pois);
    document.getElementById('category-filter').addEventListener('change', filterPOIs);
    document.getElementById('search-filter').addEventListener('input', filterPOIs);
    // Remove fallback text after map loads
    setTimeout(function() {
        if (mapDiv.innerText === 'Loading map...') mapDiv.innerText = '';
        map.invalidateSize();
    }, 300);
});
</script>
</body>
</html>
