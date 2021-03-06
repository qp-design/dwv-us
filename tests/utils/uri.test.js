/**
 * Tests for the 'utils/uri.js' file.
 */
// Do not warn if these variables were not defined before.
/* global QUnit */

/**
 * Tests for {@link dwv.utils.getUrlFromUri}.
 * Test the multiplatform version and the simple one.
 *
 * @function module:tests/utils~getUrlFromUri
 */
QUnit.test('Test getUrlFromUri.', function (assert) {
  // test #00: empty
  var uri00 = 'http://domain.org';
  var res00f = dwv.utils.getUrlFromUri(uri00);
  var res00s = dwv.utils.getUrlFromUriSimple(uri00);
  // pathname
  assert.equal(res00f.pathname, '/', 'pathname 00');
  assert.equal(res00s.pathname, res00f.pathname, 'pathname 00 simple');
  // search param
  assert.equal(res00f.searchParams.get('topic'), null, 'search params 00');
  assert.equal(res00s.searchParams.get('topic'),
    res00f.searchParams.get('topic'), 'search params 00 simple');

  // test #01: simple
  var uri01 = 'https://domain.org/dir/file';
  var res01f = dwv.utils.getUrlFromUri(uri01);
  var res01s = dwv.utils.getUrlFromUriSimple(uri01);
  // pathname
  assert.equal(res01f.pathname, '/dir/file', 'pathname 01');
  assert.equal(res01s.pathname, res01f.pathname, 'pathname 01 simple');
  // search param
  assert.equal(res01f.searchParams.get('topic'), null, 'search params 01');
  assert.equal(res01s.searchParams.get('topic'),
    res01f.searchParams.get('topic'), 'search params 01 simple');

  // test #02: with file
  var uri02 = 'https://domain.org/dir/image.jpg';
  var res02f = dwv.utils.getUrlFromUri(uri02);
  var res02s = dwv.utils.getUrlFromUriSimple(uri02);
  // pathname
  assert.equal(res02f.pathname, '/dir/image.jpg', 'pathname 02');
  assert.equal(res02s.pathname, res02f.pathname, 'pathname 02 simple');
  // search param
  assert.equal(res02f.searchParams.get('topic'), null, 'search params 02');
  assert.equal(res02s.searchParams.get('topic'),
    res02f.searchParams.get('topic'), 'search params 02 simple');

  // test #03: relative
  var uri03 = './dir/image.jpg';
  var res03f = dwv.utils.getUrlFromUri(uri03);
  var res03s = dwv.utils.getUrlFromUriSimple(uri03);
  // pathname
  assert.equal(res03f.pathname, '/dir/image.jpg', 'pathname 03');
  assert.equal(res03s.pathname, res03f.pathname, 'pathname 03 simple');
  // search param
  assert.equal(res03f.searchParams.get('topic'), null, 'search params 03');
  assert.equal(res03s.searchParams.get('topic'),
    res03f.searchParams.get('topic'), 'search params 03 simple');

  // test #10: wih search params
  var uri10 = 'https://domain.org/dir/image.jpg?accesstoken=abc';
  var res10f = dwv.utils.getUrlFromUri(uri10);
  var res10s = dwv.utils.getUrlFromUriSimple(uri10);
  // pathname
  assert.equal(res10f.pathname, '/dir/image.jpg', 'pathname 03');
  assert.equal(res10s.pathname, res10f.pathname, 'pathname 03 simple');
  // search param
  assert.equal(
    res10f.searchParams.get('accesstoken'), 'abc', 'search params 03');
  assert.equal(res10s.searchParams.get('accesstoken'),
    res10f.searchParams.get('accesstoken'), 'search params 03 simple');

  // test #11: wih search params
  var uri11 = 'https://domain.org/dir/image.jpg?accesstoken=abc&topic=secure';
  var res11f = dwv.utils.getUrlFromUri(uri11);
  var res11s = dwv.utils.getUrlFromUriSimple(uri11);
  // pathname
  assert.equal(res11f.pathname, '/dir/image.jpg', 'pathname 04');
  assert.equal(res11s.pathname, res11f.pathname, 'pathname 04 simple');
  // search param
  assert.equal(
    res11f.searchParams.get('accesstoken'), 'abc', 'search params 04');
  assert.equal(res11s.searchParams.get('accesstoken'),
    res11f.searchParams.get('accesstoken'), 'search params 04 simple');
  assert.equal(
    res11f.searchParams.get('topic'), 'secure', 'search params 04-2');
  assert.equal(
    res11s.searchParams.get('topic'),
    res11f.searchParams.get('topic'), 'search params 04-2 simple');
});

/**
 * Tests for {@link dwv.utils.splitUri}.
 *
 * @function module:tests/utils~splitUri
 */
QUnit.test('Test splitUri.', function (assert) {
  // using JSON.stringify to compare objects
  var strEmpty = JSON.stringify({});

  // undefined
  var res00 = dwv.utils.splitUri();
  assert.equal(JSON.stringify(res00), strEmpty, 'Split null');
  // null
  var res01 = dwv.utils.splitUri(null);
  assert.equal(JSON.stringify(res01), strEmpty, 'Split null');
  // empty
  var res02 = dwv.utils.splitUri('');
  assert.equal(JSON.stringify(res02), strEmpty, 'Split empty');

  // test10
  var test10 = 'root?key0';
  var res10 = dwv.utils.splitUri(test10);
  var ref10 = {base: 'root', query: {}};
  assert.equal(JSON.stringify(res10), JSON.stringify(ref10), 'Split test10');
  // test11
  var test11 = 'root?key0=val00';
  var res11 = dwv.utils.splitUri(test11);
  var ref11 = {base: 'root', query: {key0: 'val00'}};
  assert.equal(JSON.stringify(res11), JSON.stringify(ref11), 'Split test11');

  // test20
  var test20 = 'root?key0=val00&key1';
  var res20 = dwv.utils.splitUri(test20);
  var ref20 = {base: 'root', query: {key0: 'val00'}};
  assert.equal(JSON.stringify(res20), JSON.stringify(ref20), 'Split test20');
  // test21
  var test21 = 'root?key0=val00&key1=val10';
  var res21 = dwv.utils.splitUri(test21);
  var ref21 = {base: 'root', query: {key0: 'val00', key1: 'val10'}};
  assert.equal(JSON.stringify(res21), JSON.stringify(ref21), 'Split test21');

  // test30
  var test30 = 'root?key0=val00&key0&key1=val10';
  var res30 = dwv.utils.splitUri(test30);
  var ref30 = {
    base: 'root',
    query: {key0: ['val00', null], key1: 'val10'}
  };
  assert.equal(JSON.stringify(res30), JSON.stringify(ref30), 'Split test30');
  // test31
  var test31 = 'root?key0=val00&key0=val01&key1=val10';
  var res31 = dwv.utils.splitUri(test31);
  var ref31 = {
    base: 'root',
    query: {key0: ['val00', 'val01'], key1: 'val10'}
  };
  assert.equal(JSON.stringify(res31), JSON.stringify(ref31), 'Split test31');

  // test40: no root
  var test40 = '?key0=val00&key0&key1=val10';
  var res40 = dwv.utils.splitUri(test40);
  var ref40 = {
    base: '',
    query: {key0: ['val00', null], key1: 'val10'}
  };
  assert.equal(JSON.stringify(res40), JSON.stringify(ref40),
    'Split test40: no root');

});

/**
 * Tests for {@link dwv.utils.getUriQuery}.
 *
 * @function module:tests/utils~getUriQuery
 */
QUnit.test('Test get URI query.', function (assert) {
  var params;

  // test 00
  var root00 = 'http://test.com?input=';
  var uri00 = 'result';
  var full00 = root00 + encodeURIComponent(uri00);
  params = dwv.utils.getUriQuery(full00);
  var res00 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo00 = [uri00];
  assert.equal(res00.toString(), theo00.toString(), 'Http uri');
  // test 01
  var root01 = 'file:///test.html?input=';
  var uri01 = 'result';
  var full01 = root01 + encodeURIComponent(uri01);
  params = dwv.utils.getUriQuery(full01);
  var res01 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo01 = [uri01];
  assert.equal(res01.toString(), theo01.toString(), 'File uri');
  // test 02
  var root02 = 'file:///test.html?input=';
  var uri02 = 'result?a=0&b=1';
  var full02 = root02 + encodeURIComponent(uri02);
  params = dwv.utils.getUriQuery(full02);
  var res02 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo02 = [uri02];
  assert.equal(res02.toString(), theo02.toString(), 'File uri with args');

  // test 03
  var root03 = 'file:///test.html';
  var full03 = root03 + encodeURIComponent(root03);
  var res03 = dwv.utils.getUriQuery(full03);
  assert.equal(res03, null, 'File uri with no args');

  // real world URI

  // wado (called 'anonymised')
  var root10 = 'http://ivmartel.github.io/dwv/demo/static/index.html?input=';
  var uri10 = 'http://dicom.vital-it.ch:8089/wado?requestType=WADO&contentType=application/dicom&studyUID=1.3.6.1.4.1.19291.2.1.1.2675258517533100002&seriesUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749034.88493&objectUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749034.96207';
  var full10 = root10 + encodeURIComponent(uri10);
  params = dwv.utils.getUriQuery(full10);
  var res10 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo10 = [uri10];
  assert.equal(res10.toString(), theo10.toString(), 'Wado url');

  // babymri
  var root11 = 'http://ivmartel.github.io/dwv/demo/static/index.html?input=';
  var uri11 = 'http://x.babymri.org/?53320924&.dcm';
  var full11 = root11 + encodeURIComponent(uri11);
  params = dwv.utils.getUriQuery(full11);
  var res11 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo11 = [uri11];
  assert.equal(res11.toString(), theo11.toString(), 'Babymri uri');

  // github
  var root12 = 'http://ivmartel.github.io/dwv/demo/static/index.html?input=';
  var uri12 = 'https://github.com/ivmartel/dwv/blob/master/data/cta0.dcm?raw=true';
  var full12 = root12 + encodeURIComponent(uri12);
  params = dwv.utils.getUriQuery(full12);
  var res12 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo12 = [uri12];
  assert.equal(res12.toString(), theo12.toString(), 'Github uri');

  // multiple URI

  // simple test: one argument
  var root20 = 'file:///test.html?input=';
  var uri20 = 'result?a=0';
  var full20 = root20 + encodeURIComponent(uri20);
  params = dwv.utils.getUriQuery(full20);
  var res20 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo20 = ['result?a=0'];
  assert.equal(
    res20.toString(), theo20.toString(), 'Multiple key uri with one arg');

  // simple test: two arguments
  var root21 = 'file:///test.html?input=';
  var uri21 = 'result?a=0&a=1';
  var full21 = root21 + encodeURIComponent(uri21);
  params = dwv.utils.getUriQuery(full21);
  var res21 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo21 = ['result?a=0', 'result?a=1'];
  assert.equal(
    res21.toString(), theo21.toString(), 'Multiple key uri with two args');

  // simple test: three arguments
  var root22 = 'file:///test.html?input=';
  var uri22 = 'result?a=0&a=1&a=2';
  var full22 = root22 + encodeURIComponent(uri22);
  params = dwv.utils.getUriQuery(full22);
  var res22 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo22 = ['result?a=0', 'result?a=1', 'result?a=2'];
  assert.equal(
    res22.toString(), theo22.toString(), 'Multiple key uri with three args');

  // simple test: plenty arguments
  var root23 = 'file:///test.html?input=';
  var uri23 = 'result?a=0&a=1&a=2&b=3&c=4';
  var full23 = root23 + encodeURIComponent(uri23);
  params = dwv.utils.getUriQuery(full23);
  var res23 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo23 = [
    'result?b=3&c=4&a=0',
    'result?b=3&c=4&a=1',
    'result?b=3&c=4&a=2'
  ];
  assert.equal(
    res23.toString(), theo23.toString(), 'Multiple key uri with plenty args');

  // simple test: no root
  var root24 = 'file:///test.html?input=';
  var uri24 = '?a=0&a=1&a=2';
  var full24 = root24 + encodeURIComponent(uri24) + '&dwvReplaceMode=void';
  params = dwv.utils.getUriQuery(full24);
  var res24 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo24 = ['0', '1', '2'];
  assert.equal(
    res24.toString(), theo24.toString(),
    'Multiple key uri and no root');

  // real world multiple URI

  // wado (called 'anonymised')
  var root30 = 'http://ivmartel.github.io/dwv/demo/static/index.html?input=';
  var uri30 = 'http://dicom.vital-it.ch:8089/wado?requestType=WADO&contentType=application/dicom&studyUID=1.3.6.1.4.1.19291.2.1.1.2675258517533100002&seriesUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749034.88493&objectUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749034.96207&objectUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749216.165708';
  var full30 = root30 + encodeURIComponent(uri30);
  params = dwv.utils.getUriQuery(full30);
  var res30 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo30 = [
    'http://dicom.vital-it.ch:8089/wado?requestType=WADO&contentType=application/dicom&studyUID=1.3.6.1.4.1.19291.2.1.1.2675258517533100002&seriesUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749034.88493&objectUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749034.96207',
    'http://dicom.vital-it.ch:8089/wado?requestType=WADO&contentType=application/dicom&studyUID=1.3.6.1.4.1.19291.2.1.1.2675258517533100002&seriesUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749034.88493&objectUID=1.2.392.200036.9116.2.6.1.48.1215564802.1245749216.165708'
  ];
  assert.equal(res30.toString(), theo30.toString(), 'Multiple Wado url');

  // babymri: test for replaceMode
  var root31 = 'http://ivmartel.github.io/dwv/demo/static/index.html?input=';
  var uri31 = 'http://x.babymri.org/?key=53320924&key=53320925&key=53320926';
  var full31 = root31 + encodeURIComponent(uri31) + '&dwvReplaceMode=void';
  params = dwv.utils.getUriQuery(full31);
  var res31 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo31 = [
    'http://x.babymri.org/?53320924',
    'http://x.babymri.org/?53320925',
    'http://x.babymri.org/?53320926'
  ];
  assert.equal(
    res31.toString(), theo31.toString(), 'Multiple baby mri (replaceMode)');

  // babymri: test for replaceMode and no root
  var root32 = 'http://ivmartel.github.io/dwv/demo/static/index.html?input=';
  var uri32 = '?key=http://x.babymri.org/?53320924&key=http://x.babymri.org/?53320925&key=http://x.babymri.org/?53320926';
  var full32 = root32 + encodeURIComponent(uri32) + '&dwvReplaceMode=void';
  params = dwv.utils.getUriQuery(full32);
  var res32 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo32 = [
    'http://x.babymri.org/?53320924',
    'http://x.babymri.org/?53320925',
    'http://x.babymri.org/?53320926'
  ];
  assert.equal(
    res32.toString(), theo32.toString(),
    'Multiple baby mri with no root (replaceMode)');

  // github: not supported

  // simple links (no query)

  // simple test: plenty arguments
  var root40 = 'file:///test.html?input=';
  var uri40 = 'web/path/to/file/?file=0.dcm&file=1.dcm&file=2.dcm';
  var full40 = root40 + encodeURIComponent(uri40) + '&dwvReplaceMode=void';
  params = dwv.utils.getUriQuery(full40);
  var res40 = dwv.utils.decodeKeyValueUri(params.input, params.dwvReplaceMode);
  var theo40 = [
    'web/path/to/file/0.dcm',
    'web/path/to/file/1.dcm',
    'web/path/to/file/2.dcm'
  ];
  assert.equal(res40.toString(), theo40.toString(), 'Multiple file-like uri');

});

/**
 * Tests for {@link dwv.utils.decodeManifest}.
 *
 * @function module:tests/utils~decodeManifest
 */
QUnit.test('Test decode Manifest.', function (assert) {
  // test values
  var wadoUrl = 'http://my.pacs.org:8089/wado';
  var studyInstanceUID = '1.2.840.113619.2.134.1762680288.2032.1122564926.252';
  var seriesInstanceUID0 =
    '1.2.840.113619.2.134.1762680288.2032.1122564926.253';
  var sOPInstanceUID00 = '1.2.840.113619.2.134.1762680288.2032.1122564926.254';
  var sOPInstanceUID01 = '1.2.840.113619.2.134.1762680288.2032.1122564926.255';
  var seriesInstanceUID1 =
    '1.2.840.113619.2.134.1762680288.2032.1122564926.275';
  var sOPInstanceUID10 = '1.2.840.113619.2.134.1762680288.2032.1122564926.276';
  var sOPInstanceUID11 = '1.2.840.113619.2.134.1762680288.2032.1122564926.277';
  var sOPInstanceUID12 = '1.2.840.113619.2.134.1762680288.2032.1122564926.275';

  // create a test manifest
  var doc = document.implementation.createDocument(null, 'wado_query', null);
  doc.documentElement.setAttribute('wadoURL', wadoUrl);
  // series 0
  var instance00 = doc.createElement('Instance');
  instance00.setAttribute('SOPInstanceUID', sOPInstanceUID00);
  var instance01 = doc.createElement('Instance');
  instance01.setAttribute('SOPInstanceUID', sOPInstanceUID01);
  var series0 = doc.createElement('Series');
  series0.setAttribute('SeriesInstanceUID', seriesInstanceUID0);
  series0.appendChild(instance00);
  series0.appendChild(instance01);
  // series 1
  var instance10 = doc.createElement('Instance');
  instance10.setAttribute('SOPInstanceUID', sOPInstanceUID10);
  var instance11 = doc.createElement('Instance');
  instance11.setAttribute('SOPInstanceUID', sOPInstanceUID11);
  var instance12 = doc.createElement('Instance');
  instance12.setAttribute('SOPInstanceUID', sOPInstanceUID12);
  var series1 = doc.createElement('Series');
  series1.setAttribute('SeriesInstanceUID', seriesInstanceUID1);
  series1.appendChild(instance10);
  series1.appendChild(instance11);
  series1.appendChild(instance12);
  // study
  var study = doc.createElement('Study');
  study.setAttribute('StudyInstanceUID', studyInstanceUID);
  study.appendChild(series0);
  study.appendChild(series1);
  // patient
  var patient = doc.createElement('Patient');
  patient.appendChild(study);
  // main
  doc.documentElement.appendChild(patient);

  // decode (only reads first series)
  var res = dwv.utils.decodeManifest(doc, 2);
  // theoretical test decode result
  var middle = '?requestType=WADO&contentType=application/dicom&';
  var theoLinkRoot = wadoUrl + middle + '&studyUID=' + studyInstanceUID +
        '&seriesUID=' + seriesInstanceUID0;
  var theoLink = [theoLinkRoot + '&objectUID=' + sOPInstanceUID00,
    theoLinkRoot + '&objectUID=' + sOPInstanceUID01];

  assert.equal(res[0], theoLink[0], 'Read regular manifest link0');
  assert.equal(res[1], theoLink[1], 'Read regular manifest link1');
});
