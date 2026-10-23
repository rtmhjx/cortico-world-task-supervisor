export default { panels: { status: { mount(ctx) {
  const ui = ctx.ui, sheet = ui.sheet({ title: '会话控制', en: 'CONVERSATIONS' });
  const bar = ui.rowbar(), message = ui.msgline('读取状态…'), body = ui.h('div'); let loading = false;
  const refresh = async () => {
    if (loading || ctx.signal.aborted) return; loading = true;
    try {
      const s = await ctx.invoke('snapshot'); if (ctx.signal.aborted) return;
      message.textContent = s.currentError ? `检查异常：${s.currentError}` : s.router?.degraded ? '持久状态不可写，已停止新操作' : s.running ? '会话路由已启用' : '会话路由已停用';
      message.classList.toggle('bad', !!s.currentError || !!s.router?.degraded);
      body.replaceChildren(ui.statgrid([{ k: '已选目标', v: s.router?.selections ?? 0 }, { k: '操作回执', v: s.router?.operations?.length ?? 0 }, { k: '待回报', v: s.pendingReports }]),
        ui.kv([{ k: '本机网关', v: s.endpoint ?? '未启用' }, { k: '最近检查', v: s.lastPollAt ?? '暂无' }]), ui.section('操作状态'),
        ...(s.router?.operations ?? []).slice(-30).reverse().map(op => ui.kv([{ k: '操作', v: op.operationId }, { k: '框架', v: op.framework }, { k: '会话', v: op.targetId }, { k: '状态', v: op.status }, { k: '原因', v: op.errorCode ?? '暂无' }])));
    } catch (error) { message.textContent = `状态读取失败：${error instanceof Error ? error.message : String(error)}`; message.classList.add('bad'); }
    finally { loading = false; }
  };
  bar.append(ui.button('刷新', { onClick: () => { void refresh(); } })); sheet.body.append(bar, message, body); ctx.root.append(sheet.el);
  void refresh(); ctx.interval(() => { void refresh(); }, 5000);
} } } };
