window.onload = function() {
    // handler for token input form submission
    document.getElementById('tokenForm').addEventListener('submit', function(evt) {
        // prevent the default behavior of a page reload on submit
        evt.preventDefault();
        // check to make sure an actual value has been submitted for the token
        var token = document.getElementById('token').value;
        if (token != null && token != '') {
            // naively set the global token variable, assuming the user-specified token is valid.
            // if any future API request fails due to authentication, the token popup will open again. 
            window.TOKEN = token;
            // disable the popup and app overlay for now since `token` value is not null
            document.getElementById('tokenPopup').style.display = 'none';
            document.getElementById('grayPageOverlay').style.display = 'none';
        }
    });

    // handler for token input value change
    document.getElementById('token').addEventListener('change', function(evt) {
        // as long as there is a real value in the input field when the DOM element loses focus,
        // we handle the value change as if it were an explicit form submission.
        // this has the side effect of submitting the autofilled form on any mouse or key event after page load.
        if (this.value != null) {
            // set the global token value which we will later use
            // to pass in to every API request
            window.TOKEN = this.value;
            // hide the token popup form
            document.getElementById('tokenPopup').style.display = 'none';
            // hide the gray page overlay
            document.getElementById('grayPageOverlay').style.display = 'none';
        }
    });

    document.getElementById('selectForecastToggle').onclick = function() {
        if (this.className != 'pressed') {
            // enable clicking on map to request forequest
            // and change the cursor to indicate new mode has been entered
            this.className = 'pressed';
            document.body.style.cursor = 'crosshair';
            ENABLE_FORECAST = true;
        } else {
            // unpress the button if it's already activated
            this.className = '';
            document.body.style.cursor = 'default';
            ENABLE_FORECAST = false;
        }
    };

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    window.TODAY = mm + '/' + dd + '/' + yyyy;
    // add first route input form
    addRoute();
}