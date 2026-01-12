const severityOrder = {
  fatal: 4,
  error: 3,
  warning: 2,
  information: 1
};

export function isOperationOutcome(response) {
  return response && response.resourceType === 'OperationOutcome';
}

export function extractErrorMessages(operationOutcome) {
  if (!operationOutcome?.issue || !Array.isArray(operationOutcome.issue)) {
    return [];
  }

  return operationOutcome.issue.map(issue => {
    const parts = [];

    if (issue.severity) {
      parts.push(`[${issue.severity.toUpperCase()}]`);
    }

    if (issue.details?.text) {
      parts.push(issue.details.text);
    } else if (issue.diagnostics) {
      parts.push(issue.diagnostics);
    } else if (issue.code) {
      parts.push(issue.code);
    }

    return parts.join(' ');
  }).filter(msg => msg.length > 0);
}

export function getHighestSeverity(operationOutcome) {
  if (!operationOutcome?.issue || !Array.isArray(operationOutcome.issue)) {
    return 'error';
  }

  let highest = 'information';
  for (const issue of operationOutcome.issue) {
    if (issue.severity && severityOrder[issue.severity] > severityOrder[highest]) {
      highest = issue.severity;
    }
  }
  return highest;
}
