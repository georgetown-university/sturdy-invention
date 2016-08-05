$(document).ready(function() {

  /* ---
   * Global variables set up.
   */

  var map_url    = 'https://gtucommunityoutreach.cartodb.com/api/v2/viz/3b95a1e2-fdc5-11e5-821e-0ea31932ec1d/viz.json',
      table_name = 'cartodb_1',
      map_css    = '#outreach_data {marker-fill: #FF0000;}',
      user_name  = 'gtucommunityoutreach';


  /* ---
   * Load the full map on page load.
   */

  cartodb.createVis('map', map_url)
    .done(function(vis, layers){
      // Hide the original layer.
      layers[1].remove();

      // Filter map based on default checked filter items.
      filterMap(vis, layers);

      // Click events for map filters.
      $('#filters input[type=checkbox]').change(function() {
        filterMap(vis, layers);
      });

      $('#filters .only').click(function(event) {
        event.preventDefault();
        selectOnly(this);
        filterMap(vis, layers);
      });

      $('#filter--search-button').click(function(event) {
        event.preventDefault();
        filterMap(vis, layers);
      });

      $('#reset-filters').click(function(event) {
        event.preventDefault();
        resetMap(vis, layers);
      });

    });


  /* ---
   * FUNCTION
   * Filters the map by selected filters in the UI.
   */

  function filterMap(vis, layers) {
    // Remove extra map layers.
    removeExtraLayers();

    // Construct new layer.
    var layerSource = {
      user_name: user_name,
      type:      'cartodb',
      sublayers: [{
        sql:      constructQuery(),
        cartocss: map_css,
      }]
    };

    // Display the new layer.
    var map_object = vis.getNativeMap();
    cartodb.createLayer(map_object, layerSource).addTo(map_object, 1);
  }


  /* ---
   * FUNCTION
   * Resets map to default filter settings (everything checked).
   */

  function resetMap(vis, layers) {
    removeExtraLayers();
    $('#filters input[type=checkbox]').prop('checked', true);
    $('#filters input[type=text]').val('');
    filterMap(vis, layers);
  }


  /* ---
   * FUNCTION
   * Select only that checkbox; deselect the rest in that fieldset.
   */

  function selectOnly(el) {
    // First, deselect everything in this fieldset.
    var fieldset = $(el).closest('fieldset');
    var inputs = $('input[type=checkbox]', fieldset).prop('checked', false);

    // Then select only the checkbox associated with the clicked "only" link.
    var parent = $(el).parent();
    $('input[type=checkbox]', parent).prop('checked', true);
  }


  /* ---
   * FUNCTION (helper)
   * Constructs SQL query based on checked filters in UI.
   */

  function constructQuery() {
    // Get all of the selected project topics filters.
    var campusQuery = constructWhere({
      filter: $('#filters--campus input[type=checkbox]:checked'),
      column: 'project_campus'
    });

    // Get all of the selected project topics filters.
    var topicsQuery = constructWhere({
      filter: $('#filters--topics input[type=checkbox]:checked'),
      column: 'project_topics'
    });

    var searchQuery = constructSearch({
      filter: $('#filters--search input[type=text]'),
      columns: ['account_name', 'account_topics', 'project_department', 'project_name']
    });

    // Construct the full SQL query.
    var query = "SELECT * FROM " + table_name + " WHERE (" + campusQuery + ") AND (" + topicsQuery + ")";

    if (searchQuery) {
      query += " AND (" + searchQuery + ")";
    }

    console.log(query);
    return query;
  }


  /* ---
   * FUNCTION (helper)
   * Constructs the "WHERE" part of the SQL query that checks for a particular filter.
   * Called from constructQuery()
   */

  function constructWhere(params) {
    // Get all of the topic filter checkboxes that are selected.
    var filter = params.filter,
        column = params.column,
        query = '';

    // If no topics are selected, set the query to find rows where project_topics is null.
    if (!filter.length) {
      query = " " + column + " IS NULL";
    } 
    // Otherwise, construct the part of the query that checks for topics.
    else {
      for (i=0; i<filter.length; i++) {
        if (i>0) {
          query += ' OR';
        }
          
        query += " " + column + " LIKE '%" + $(filter[i]).val() + "%'";
      }
    }

    return query;
  }


  /* ---
   * FUNCTION (helper)
   * Constructs ther "Wehre" part of the SQL query for search keywords.
   * Called from constructQuery()
   */

  function constructSearch(params) {
    var filter  = params.filter,
        columns = params.columns,
        query   = '';

    if (!filter.val()) {
      return query;
    }

    for (i=0; i<columns.length; i++) {
      if (i>0) {
        query += ' OR';
      }
          
      query += " " + columns[i] + " LIKE '%" + filter.val() + "%'";
    }

    console.log(query);

    return query;
  }


  /* ---
   * FUNCTION (helper)
   * Remove extra map layers.
   *
   * So, so hacky.  Assumes that the first 3 layers are the original map layers
   * and there is only 1 extra layer.  For POC only; relies too much on the DOM being
   * just right.
   */

  function removeExtraLayers() {
    var layers = $('.leaflet-layer');
    if (layers.length > 2) {
      $('.leaflet-layer:last-child').remove();
    }
  }

});
