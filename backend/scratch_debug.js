const EventBus = require('./src/infrastructure/event-bus/EventBus');
const AssessmentWorkflow = require('./src/modules/workflows/assessment-workflow');
const ApplicationService = require('./src/modules/application/services/application.service');
const CreditApplicationBuilder = require('./src/modules/application/entities/CreditApplication');

EventBus.resetInstance();
const bus = EventBus.getInstance();
const workflow = new AssessmentWorkflow(bus);
workflow.register();

const builder = new CreditApplicationBuilder();
builder.generateApplicationId();
builder.setProduct('KREDIT_MODAL_KERJA');
builder.setAccountOfficer('AO-TEST-001');
builder.setSubmittedAt();
const application = builder.build();

ApplicationService.submitApplication(application);

const dlq = bus.getDeadLetterQueue().getAll();
console.log(JSON.stringify(dlq, null, 2));
