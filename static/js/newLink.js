var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var linkL10n = require('ep_insert_media/static/js/linkL10n');

// Create a link object with data filled on the given form
var buildLinkFrom = function(form) {
  var text       = form.find('#hyperlink-text').val();
  var hyperlink       = form.find('#hyperlink-url').val();
  var changeFrom = form.find('.from-value').text();
  var changeTo   = form.find('.to-value').val() || null;
  var link    = {};

  link.text = text;
  link.hyperlink = hyperlink;

  if(changeTo){
    link.changeFrom = changeFrom;
    link.changeTo = changeTo;
  }

  return link;
}

// Callback for new link Cancel
var cancelNewLink = function(){
  hideNewLinkPopup();
}

// Callback for new link Submit
var submitNewLink = function(callback) {
  var index = 0;
  var form = $('#newLink');
  var link = buildLinkFrom(form);
  //@todo samir add url validation
  console.log(link,"submitNewLink")
  if (link.text.length > 0 || link.changeTo && link.changeTo.length > 0) {
    form.find('.link-content, .to-value').removeClass('error');
    hideNewLinkPopup();
    callback(link, index);
  } else {
    if (link.text.length == 0) form.find('.link-content').addClass('error');
    if (link.changeTo && link.changeTo.length == 0) form.find('.to-value').addClass('error');

  }
  return false;
}

/* ***** Public methods: ***** */

var localizenewLinkPopup = function() {
  var newLinkPopup = $('#newLink');
  if (newLinkPopup.length !== 0) linkL10n.localize(newLinkPopup);
};

// Insert new Link Form
var insertNewLinkPopupIfDontExist = function(link, callback) {
  $('#newLink').remove();
  var newLinkPopup = $('#newLink');

  link.linkId = "";
  var newLinkPopup = $('#newLinkTemplate').tmpl(link);
  newLinkPopup.appendTo($('#editorcontainerbox'));

  localizenewLinkPopup();

  // Listen for include suggested change toggle
  $('#newLink').find('.suggestion-checkbox').change(function() {
    $('#newLink').find('.suggestion').toggle($(this).is(':checked'));
  });

  // Cancel btn
  newLinkPopup.find('#link-reset').on('click', function() {
    cancelNewLink();
  });
  // Create btn
  $('#newLink').on("submit", function(e) {
    e.preventDefault();
    return submitNewLink(callback);
  });

  return newLinkPopup;
};

var showNewLinkPopup = function() {
  // position below link icon
  $('#newLink').css('left', $('.toolbar .addMedia').offset().left)

  // Reset form to make sure it is all clear
  $('#newLink').find('.suggestion-checkbox').prop('checked', false).trigger('change');
  $('#newLink').find('textarea').val("");
  $('#newLink').find('.link-content, .to-value').removeClass('error');

  // Show popup
  $('#newLink').addClass("popup-show");

  // mark selected text, so it is clear to user which text range the link is being applied to
  pad.plugins.ep_insert_media.preLinkMarker.markSelectedText();
}

var hideNewLinkPopup = function() {
  $('#newLink').removeClass("popup-show");

  // force focus to be lost, so virtual keyboard is hidden on mobile devices
  $('#newLink').find(':focus').blur();

  // unmark selected text, as now there is no text being linked
  pad.plugins.ep_insert_media.preLinkMarker.unmarkSelectedText();
}

exports.localizenewLinkPopup = localizenewLinkPopup;
exports.insertNewLinkPopupIfDontExist = insertNewLinkPopupIfDontExist;
exports.showNewLinkPopup = showNewLinkPopup;
exports.hideNewLinkPopup = hideNewLinkPopup;
