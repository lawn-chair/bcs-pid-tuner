/*global BCS */
(function () {
var bcs;
var interval = null;

function updateTuningLog(pid) {
  $('.tuning .list').prepend($('<div class="row">').append([
    $('<div class="col-md-2">').html(pid['tuning_values'].error),
    $('<div class="col-md-2">').html(pid['tuning_values'].pTerm),
    $('<div class="col-md-2">').html(pid['tuning_values'].iTerm),
    $('<div class="col-md-2">').html(pid['tuning_values'].dTerm),
    $('<div class="col-md-2">').html(pid['tuning_values'].output)
  ]));
}

function displayOutputs(outputs) {
  clearInterval(interval);
  outputs.forEach(function (output, i) {
    bcs.read('pid/' + i).then(function (pid) {
      var group = $('.outputs .list [data-output=' + i + '] .form-group');
      group.find('[data-name="output"]').html(output.name);

      for(var property in pid) {
        if(property === 'tuning') {
          group.find('[data-name=tuning]')[0].checked = pid.tuning;
        } else {
          group.find('[data-name="' + property + '"]').val(pid[property]);
        }
      }

      if(pid.tuning) {
        updateTuningLog(pid);
        interval = setInterval(function () { 
          bcs.read('pid/' + i).then(updateTuningLog);
        }, 1000);
      }
    });
  });
}

$( document ).ready( function () {

    /*
        When a BCS url is entered, verify that it is running 4.0
    */
    $('#bcs').on('change', function (event) {
        $('#bcs').parent().removeClass('has-success').removeClass('has-error');

        if($(event.target.parentElement).find('.credentials [data-name=password]')[0]) {
          bcs = new BCS.Device(event.target.value, {
            auth: {
              username: 'admin',
              password: $(event.target.parentElement).find('.credentials [data-name=password]')[0].value
            }});
        } else {
          bcs = new BCS.Device(event.target.value);
        }

        bcs.on('ready', function () {
          localStorage['bcs-backup.url'] = event.target.value;
          $('#bcs').parent().addClass('has-success');

          bcs.helpers.getOutputs().then(displayOutputs);
        })
        .on('notReady', function (e) {
          $('#bcs').parent().addClass('has-error');
          if(e.cors && e.cors === 'rejected') {
            $('.credentials').removeClass('hide');
          }
        });
    });

    $('[data-name=password]').on('change', function () {
      $('[data-name=bcs]').change();
    });

    /*
        Restore the URL on page load if we saved one in localStorage
    */
    if(localStorage['bcs-backup.url'])
    {
        $('[data-name=bcs]').val(localStorage['bcs-backup.url']);
        $('[data-name=bcs]').change();
    }

    $('input[data-name]').on('change', function (event) {
      if(bcs && bcs.ready) {
        var element = $(event.target);
        var data = {};
        if(element.attr('type') === 'checkbox') {
          data[element.attr('data-name')] = element[0].checked;
        } else {
          data[element.attr('data-name')] = Number(element.val());
        }
        bcs.write('pid/' + element.parents('form').attr('data-output'), data).then(function () {
          bcs.helpers.getOutputs().then(displayOutputs);
        });
        console.log(event.target);
      }
    });
    
});

    
})();
