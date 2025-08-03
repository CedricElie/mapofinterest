<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Map of Interest</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div class="header">Map of Interest</div>
    <div class="split-container">
        <div class="left-pane">
            <div class="carousel" id="featureCarousel">
                <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Map Feature" id="carouselImg">
                <div class="carousel-title" id="carouselTitle">Share Points of Interest</div>
                <div class="carousel-desc" id="carouselDesc">Add and share your favorite places on the map for everyone to discover.</div>
                <div class="carousel-controls">
                    <button id="carouselPrev">&#8592;</button>
                    <button id="carouselNext">&#8594;</button>
                </div>
            </div>
        </div>
        <div class="right-pane">
            <div class="login-container">
                <h2 class="text-center mb-4">Login</h2>
                <form id="loginForm" method="post" action="" autocomplete="off">
                    <div class="alert alert-danger py-2 text-center" id="loginError" style="display:none;"></div>
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="username" name="username" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Login</button>
                </form>
                <a class="subscribe-link" href="subscribe.php">Don't have an account? Subscribe</a>
            </div>
        </div>
    </div>
    <script>
        // Carousel data
        const features = [
            {
                img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
                title: 'Share Points of Interest',
                desc: 'Add and share your favorite places on the map for everyone to discover.'
            },
            {
                img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
                title: 'Filter by Category',
                desc: 'Easily filter POIs by category to find exactly what you need.'
            },
            {
                img: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80',
                title: 'Community Driven',
                desc: 'See and comment on POIs added by other users in the community.'
            }
        ];
        let currentFeature = 0;
        function updateCarousel() {
            document.getElementById('carouselImg').src = features[currentFeature].img;
            document.getElementById('carouselTitle').textContent = features[currentFeature].title;
            document.getElementById('carouselDesc').textContent = features[currentFeature].desc;
            document.getElementById('carouselPrev').disabled = currentFeature === 0;
            document.getElementById('carouselNext').disabled = currentFeature === features.length - 1;
        }
        document.getElementById('carouselPrev').onclick = function() {
            if (currentFeature > 0) {
                currentFeature--;
                updateCarousel();
            }
        };
        document.getElementById('carouselNext').onclick = function() {
            if (currentFeature < features.length - 1) {
                currentFeature++;
                updateCarousel();
            }
        };
        updateCarousel();
 
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            // Placeholder: send login data to backend
            // For now, just show an error for any input
            e.preventDefault();
            document.getElementById('loginError').textContent = 'Login functionality not implemented yet.';
            document.getElementById('loginError').style.display = 'block';
        });
    </script>
</body>
</html>
 