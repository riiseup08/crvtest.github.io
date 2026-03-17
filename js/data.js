function loadData(url) {
    return fetch(url)
        .then(response => response.json())
        .catch(error => console.error('Error loading data:', error));
}

function filterData(data, criteria) {
    return data.filter(item => {
        return Object.keys(criteria).every(key => {
            return item[key] === criteria[key];
        });
    });
}

function categorizeData(data, categoryKey) {
    return data.reduce((categories, item) => {
        const key = item[categoryKey];
        if (!categories[key]) {
            categories[key] = [];
        }
        categories[key].push(item);
        return categories;
    }, {});
}

function toGeoJSON(data) {
    return {
        type: 'FeatureCollection',
        features: data.map(item => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [item.longitude, item.latitude]
            },
            properties: item
        }))
    };
}