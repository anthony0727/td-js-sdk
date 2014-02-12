  /*! 
  * -----------------
  * Keen IO Query JS
  * -----------------
  */

  Keen.Query = function(){};
  Keen.Query.prototype = {
    configure: function(eventCollection, options) {
      this.path = '/queries/' + options.analysisType;
      this.params = {
        event_collection: eventCollection,
        target_property: options.targetProperty,
        group_by: options.groupBy,
        filters: options.filters,
        timeframe: options.timeframe,
        interval: options.interval,
        timezone: (options.timezone || _build_timezone_offset()),
        latest: options.latest
      };
      return this;
    },
    addFilter: function(property, operator, value){
      this.params.filters.push({
        "property_name": property,
        "operator": operator,
        "property_value": value
      });
      return this;
    }
  };
  
  
  Keen.Sum = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'sum';
    if (options.targetProperty === undefined) return options;
    if (!eventCollection || !options.targetProperty) return options;
    this.configure(eventCollection, options);
  };
  Keen.Sum.prototype = new Keen.Query();
  
  
  Keen.Count = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'count';
    if (!eventCollection) return options;
    this.configure(eventCollection, options);
  };
  Keen.Count.prototype = new Keen.Query();
  
  
  Keen.CountUnique = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'count_unique';
    if (!eventCollection || !options.targetProperty) return options;
    this.configure(eventCollection, options);
  };
  Keen.CountUnique.prototype = new Keen.Query();
  
  
  Keen.Minimum = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'minimum';
    if (!eventCollection || !options.targetProperty) return options;
    this.configure(eventCollection, options);
  };
  Keen.Minimum.prototype = new Keen.Query();
  
  
  Keen.Maximum = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'maximum';
    if (!eventCollection || !options.targetProperty) return options;
    this.configure(eventCollection, options);
  };
  Keen.Maximum.prototype = new Keen.Query();
  
  
  Keen.Average = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'average';
    if (!eventCollection || !options.targetProperty) return options;
    this.configure(eventCollection, options);
  };
  Keen.Average.prototype = new Keen.Query();
  
  
  Keen.SelectUnique = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'select_unique';
    if (!eventCollection || !options.targetProperty) return options;
    this.configure(eventCollection, options);
  };
  Keen.SelectUnique.prototype = new Keen.Query();
  
  
  Keen.Extraction = function(eventCollection, config){
    var options = (config || {});
    options.analysisType = 'extraction';
    if (!eventCollection) return options;
    this.configure(eventCollection, options);
  };
  Keen.Extraction.prototype = new Keen.Query();
  

  // -------------------------------
  // Keen.query() Method
  // -------------------------------  

  Keen.prototype.query = function(query, success, error) {
    
    var queries = [];
    var requests = 0;
    var response = [];
    
    var handleSuccess = function(res){
      response[res.sequence] = res; 
      response[res.sequence]['query'] = queries[res.sequence];
      requests++;
      if (success && requests == queries.length){
        if (queries.length == 1) {
          success(response[0]);
        } else {
          success(response);
        }
        
      } 
    };
    
    var handleFailure = function(res){
      var response = JSON.parse(res.responseText);
      Keen.log(res.statusText + ' (' + response.error_code + '): ' + response.message);
      if (error) error(res);
    };
    
    if ( Object.prototype.toString.call(query) === '[object Array]' ) {
      queries = query;
    } else {
      queries.push(query);
    }

    for (var i = 0; i < queries.length; i++) {
      var url = null;
      if (queries[i] instanceof Keen.Query) {
        url = _build_url.apply(this, [queries[i].path]);
        url += "?api_key=" + this.client.readKey;
        url += _build_query_string.apply(this, [queries[i].params]);
        
      } else if ( Object.prototype.toString.call(queries[i]) === '[object String]' ) {
        url = _build_url.apply(this, ['/saved_queries/' + encodeURIComponent(queries[i]) + '/result']);
        url += "?api_key=" + this.client.readKey;
        
      } else {
        var res = {
          statusText: 'Bad Request',
          responseText: { message: 'Error: Query ' + (i+1) + ' of ' + queries.length + ' for project ' + this.client.projectId + ' is not a valid request' }
        };
        Keen.log(res.responseText.message);
        Keen.log('Check out our JavaScript SDK Usage Guide for Data Analysis:');
        Keen.log('https://keen.io/docs/clients/javascript/usage-guide/#analyze-and-visualize');
        if (error) error(res.responseText.message);
      }
      if (url) _send_query.apply(this, [url, i, handleSuccess, handleFailure]);
    }
    return this;
  };


  // Private for Keen.Query Objects
  // --------------------------------

  function _build_timezone_offset(){
    return new Date().getTimezoneOffset() * -60;
  };
  
  function _build_query_string(params){
    var query = [];
    for (var key in params) {
      if (params[key]) {
        var value = params[key];
        if (Object.prototype.toString.call(value) !== '[object String]') {
          value = JSON.stringify(value);
        }
        value = encodeURIComponent(value);
        query.push(key + '=' + value);
      }
    }
    return "&" + query.join('&');
  };
  
  function _send_query(url, sequence, success, error){
    switch(this.client.requestType){
      case 'xhr':
        _request.xhr.apply(this, ["GET", url, null, null, this.client.readKey, success, error, sequence]);
        break;
      case 'jsonp':
      case 'beacon':
        _request.jsonp.apply(this, [url, this.client.readKey, success, error, sequence])
        break;
    }
  };
  