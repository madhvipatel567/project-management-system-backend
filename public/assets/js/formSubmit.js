$('.customeForm').submit(function (event) {
  event.preventDefault();
  var form = $(this);
  var url = form.attr('action');
  var method = form.attr('method');
  var redirect = form.attr('redirect');
  var formData = new FormData(this);
  var btnText = $('button:submit').html();
  $('button:submit').prop('disabled', true);
  $('button:submit').html(
    `<i class="fa fa-spinner fa-spin"></i>&nbsp;&nbsp;${btnText}`,
  );
  $('.custom_alert').remove();

  let ajaxConfig = {
    cache: false,
    contentType: false,
    processData: false,
  };
  if (form.attr('enctype') !== 'multipart/form-data') {
    formData = Object.fromEntries(formData.entries());
    ajaxConfig = {};
  }

  $.ajax({
    url: url,
    type: method,
    data: formData,
    ...ajaxConfig,
    success: function (response) {
      sendformSuccess(response, form);
      if (redirect) {
        window.location.replace(redirect);
      } else {
        $('button:submit').html(btnText);
        $('button:submit').prop('disabled', false);
      }
    },
    error: function (response) {
      $('button:submit').html(btnText);
      $('button:submit').prop('disabled', false);
      sendFormError(response, form);
    },
  });
});

function sendformSuccess(response, form) {
  const html = `<div class="alert alert-success alert-dismissible fade show custom_alert">
                  ${response.message}
                </div>`;
  form.prepend(html);
}

function sendFormError(response, form) {
  let li = '';
  if (
    typeof response.responseJSON.message === 'object' ||
    typeof response.responseJSON.message === 'array'
  ) {
    response.responseJSON.message.forEach((row) => {
      li += `<li>${row}</li>`;
    });
  } else {
    li = `<li>${response.responseJSON.message}</li>`;
  }
  const html = `<div class="alert alert-danger alert-dismissible fade show custom_alert">
                  <ul class="m-0">
                    ${li}
                  </ul>
                </div>`;
  form.prepend(html);
}
