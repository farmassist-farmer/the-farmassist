// Modified JavaScript to integrate with backend API

document.addEventListener('DOMContentLoaded', function() {
    // Reference to the search form and results container
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    
    // Event listener for search form submission
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const query = searchInput.value.trim();
        
        if (query) {
            // Get selected content types (checkboxes)
            const selectedTypes = Array.from(document.querySelectorAll('input[name="content-type"]:checked'))
                .map(checkbox => checkbox.value);
            
            // Get selected category (dropdown)
            const selectedCategory = document.getElementById('filter-category').value;
            
            // Create filters object
            const filters = {
                types: selectedTypes,
                category: selectedCategory
            };
            
            // Show loading indicator
            resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
            
            // Call API to get search results
            fetchSearchResults(query, filters)
                .then(results => {
                    displayResults(results, query);
                })
                .catch(error => {
                    resultsContainer.innerHTML = '<div class="error">Error fetching search results. Please try again.</div>';
                    console.error(error);
                });
        } else {
            resultsContainer.innerHTML = '<div class="no-results">Please enter a search term.</div>';
        }
    });
    
    // Event listeners for filter changes to update results immediately
    const filters = document.querySelectorAll('input[name="content-type"], #filter-category');
    filters.forEach(filter => {
        filter.addEventListener('change', function() {
            const query = searchInput.value.trim();
            if (query) {
                // Trigger search with updated filters
                searchForm.dispatchEvent(new Event('submit'));
            }
        });
    });
    
    // Function to fetch search results from server API
    async function fetchSearchResults(query, filters) {
        try {
            const response = await fetch('/search-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    filters: filters
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Error fetching search results:', error);
            throw error;
        }
    }
    
    // Function to display search results
    function displayResults(results, query) {
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No results found. Try different keywords or filters.</div>';
            return;
        }
        
        // Create and append result items
        results.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // Highlight matching text in title and description
            const highlightedTitle = highlightText(item.title, query);
            const highlightedDesc = highlightText(item.description, query);
            
            // Format the date
            const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Set the result item content
            resultItem.innerHTML = `
                <h3 class="result-title">${highlightedTitle}</h3>
                <p class="result-description">${highlightedDesc}</p>
                <div class="result-meta">
                    <span>${capitalizeFirst(item.category)}</span> | 
                    <span>${capitalizeFirst(item.type)}</span> | 
                    <span>${formattedDate}</span>
                </div>
            `;
            
            // Add click event to navigate to the content page
            resultItem.addEventListener('click', function() {
                window.location.href = `/content.php?id=${item.id}`;
            });
            
            resultsContainer.appendChild(resultItem);
        });
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Function to highlight matching text
    function highlightText(text, query) {
        if (!query) return text;
        
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        
        if (!textLower.includes(queryLower)) return text;
        
        const startIndex = textLower.indexOf(queryLower);
        const endIndex = startIndex + query.length;
        
        return text.substring(0, startIndex) + 
               `<span class="highlight">${text.substring(startIndex, endIndex)}</span>` + 
               text.substring(endIndex);
    }
});