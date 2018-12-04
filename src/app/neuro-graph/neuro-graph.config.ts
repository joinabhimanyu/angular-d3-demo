export const allMessages = {
  'neuroRelated': 'neuro:related',
  'invokeAddRelapses': 'invoke:add:relapses',
  'invokeAddEdss': 'invoke:add:edss',
  'invokeAddWalk25Feet': 'invoke:add:walk25Feet',
  'toggleVirtualCaseload': 'toggle:virtual:caseload',
  'graphScaleUpdated': 'graph:scale:updated',
  'timelineScroll': 'timeline:scroll',
  'demographicEnableCheckBox': 'demographic:enable:check:box',
  'checkboxEnable': 'checkbox:enable',
  'showCustomError': 'show:custom:error',
  'showLogicalError': 'show:logical:error',
  'refreshVirtualCaseload': 'refresh:virtual:caseload'
};

export const allHttpMessages = {
  'virtualCaseloadLearnmore': 'virtual:caseload:learnmore',
  'httpGetWalk25Feet': 'http:get:walk25Feet',
  'httpPostWalk25Feet': 'http:post:walk25Feet',
  'httpPutWalk25Feet': 'http:put:walk25Feet',

  'httpGetEdss': 'http:get:edss',
  'httpPostEdss': 'http:post:edss',
  'httpPutEdss': 'http:put:edss',

  'httpGetRelapse': 'http:get:relapse',
  'httpPutRelapse': 'http:put:relapse',
  'httpPostRelapse': 'http:post:relapse',
  'httpDeleteRelapse': 'http:delete:relapse',

  'httpGetDmt': 'http:get:dmt',
  'httpPostDmt': 'http:post:dmt',
  'httpPutDmt': 'http:put:dmt',

  'httpGetOtherMeds': 'http:get:otherMeds',
  'httpPostOtherMeds': 'http:post:otherMeds',
  'httpPutOtherMeds': 'http:put:otherMeds',

  'httpGetCdsUserData': 'http:get:cds:user:data',
  'httpPutCdsUserData': 'http:put:cds:user:data',
  'httpPostCdsUserData': 'http:post:cds:user:data',

  'httpGetAllQuestionnaire': 'http:get:all:questionnaire',
  'httpGetImaging': 'http:get:imaging',
  'httpGetLabs': 'http:get:labs',
  'httpGetVirtualCaseLoad': 'http:get:virtualCaseLoad',
  'httpGetPatientMsData': 'http:get:patientMsData',
  'httpGetWalk25FeetInfo': 'http:get:walk25Feet:info',
  'httpGetCdsInfo': 'http:get:cds:info',

  'httpGetMedications': 'http:get:medications',
  'httpGetEncounters': 'http:get:encounters',
  'httpGetProgressNote': 'http:get:progressNote'
};

export const GRAPH_SETTINGS = {
  panel: {
    offsetHeight: 640,
    offsetWidth: 710,
    marginTop: 5,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 25
  },
  medications: {
    positionTop: 520,
    containerHeight: 110,
    chartsWidth: 665,
    dmtColor: '#607D8B',
    dmtOverlapColor: '#303945',
    vitaminDColor: '#FBC02D',
    vitaminDOverlapColor: '#A07A1C',
    otherMedsColor: '#D8DFE2',
    otherMedsOverlapColor: '#898E90'
  },
  enlargedMedications: {
    positionTop: 285,
    containerHeight: 350,
  },
  edss: {
    positionTop: 320,
    chartHeight: 200,
    maxValueY: 9,
    color: '#EA700D'
  },
  relapse: {
    positionTop: 260,
    chartHeight: 30,
    color: '#E53935'
  },
  imaging: {
    positionTop: 220,
    chartHeight: 40,
    color: '#BE90D4'
  },
  labs: {
    positionTop: 180,
    chartHeight: 40,
    color: '#00AAA5'
  },
  walk25Feet: {
    positionTop: 320,
    chartHeight: 200,
    maxValueY: 30,
    color: '#31859B'
  },
  symptoms: {
    positionTop: 260,
    chartHeight: 30,
    color: '#EA700D'
  }
};

export const errorMessages = {
  'logicalError': 'Error occured while processing {{component}} data',
  'U-006': { type: 'User Error', message: 'User tries to enter in invalid data type, range, or value (ex: date, age, etc.)' },
  'U-004': { type: 'User Error', message: 'Patient did not complete the questionnaire prior to the encounter' },
  'D-001': {
    type: 'Data Error', message: `Unexpected data that cannot be plotted - Epic/EHR sometimes contains
  text values that read "No result" instead of a numeric value` },
  'D-002': {
    type: 'Data Error', message: `Unexpected data that cannot be plotted - Source other than Epic
  sometimes contains text values that read "No result" instead of a numeric value` },
  'M-001': {
    type: 'Missing Data Notification', message: `Patient did not complete that question of the
  questionnaire prior to the encounter and it is not required` },
  'M-002': { type: 'Missing Data Notification', message: 'Data from the access data source (ex: EPIC/EHR) are not available' },
  'M-003': { type: 'Missing Data Notification', message: 'Not enough cohort data to display for this patient' },
  'M-004': {
    type: 'Missing Data Notification', message: `Age of onset required to display cohort data. Please enter the age of
  onset in the Demographics Bar and try again.` },
};

export const edssScoreChart = [
  { score: '0.0', title: 'Normal neurological exam.' }
  , { score: '1.0', title: 'No Disability, minimal signs in one FS.' }
  , { score: '1.5', title: 'No disability, minimal signs in more than one FS.' }
  , { score: '2.0', title: 'Minimal disability in one FS.' }
  , { score: '2.5', title: 'Mild disability in one FS or minimal disability in two FS.' }
  , { score: '3.0', title: 'Moderate disability in on FS, or mild disability in three or four FS. No impairment to walking.' }
  , { score: '3.5', title: 'Moderate disability in one FS and more than minimal disability in several others. No impairment to walking.' }
  , {
    score: '4.0', title: `Significant disability but self-sufficient and up and about some 12 hours a day.
  Able to walk without aid or rest for 500m.` }
  , {
    score: '4.5', title: `Significant disability but up and about much of the day, able to work a full day,
  may otherwise have some limitation of full activity or require minimal assistance. Able to walk without aid or rest for 300m.` }
  , {
    score: '5.0', title: `Disability severe enough to impair full daily activities and ability to work a full
  day without special provisions. Able to walk without aid or ret for 200m.` }
  , { score: '5.5', title: 'Disability severe enough to preclude full daily activities. Able to walk without aid or rest for 100m.' }
  , { score: '6.0', title: 'Requires a walking aid, cane, crutch, etc – to walk about 100m with our without resting.' }
  , { score: '6.5', title: 'Requires two walking aids – pair of canes, crutches, etc – to walk about 20m without resting.' }
  , {
    score: '7.0', title: `Unable to walk beyond approximately 5m even with aid. Essentially restricted to
  wheelchair, though wheels self in standard wheelchair and transfers alone. UP and about in wheelchair some 12 hours a day.` }
  , {
    score: '7.5', title: `Unable to take more than a few steps. Restricted to wheelchair and may need aid in
  transferring. Can wheel self but cannot carry on in a standard wheelchair for a full day and may require a motorized wheelchair.` }
  , {
    score: '8.0', title: `Essentially restricted to bed or chair or pushed in wheelchair. May be out of bed
  itself much of the day. Retains many self-care functions. Generally has effective use of arms.` }
  , {
    score: '8.5', title: `Essentially restricted to bed most of the day. Has some effective use of arms retains
  some self-care functions.` }
  , { score: '9.0', title: 'Confined to bed. Can still communicate and eat.' }
  , { score: '9.5', title: 'Confined to bed and totally dependent. Unable to communicate effectively or eat/swallow.' }
  , { score: '10', title: 'Death due to MS.' }
];

export const urlMaps = window['gUrlMaps'];
export const cdsMap = window['cdsMapConfig'];
export const medication = window['medicationConfig'];
export const labsConfig = window['labsConfig'];
export const imagingConfig = window['imagingConfig'];
