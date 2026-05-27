export function getFriendlyErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : '';

  if (msg.includes('REQUEST_TIMEOUT') || msg.includes('AbortError')) {
    return '请求超时，请检查网络后重试。';
  }

  if (
    msg.includes('Failed to fetch')
    || msg.includes('Network request failed')
    || msg.includes('Network Error')
  ) {
    return '网络连接失败，请确认后端服务和网络状态。';
  }

  if (msg.includes('Failed to generate plan') || msg.includes('Plan generation failed')) {
    return 'AI 计划服务暂时繁忙，请稍后再试。';
  }

  if (msg.includes('Chat failed')) {
    return 'AI 对话服务暂时不可用，请稍后再试。';
  }

  if (msg.includes('User not found')) {
    return '用户状态异常，请重新进入并再试一次。';
  }

  if (msg.includes('Draft not found') || msg.includes('No active plan')) {
    return '计划状态异常，请返回上一页重新生成。';
  }

  if (msg.trim()) {
    return `操作失败：${msg}`;
  }

  return '操作失败，请稍后重试。';
}
