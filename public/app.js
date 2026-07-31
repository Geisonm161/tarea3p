const elements = {
  list: document.querySelector('#task-list'),
  template: document.querySelector('#task-template'),
  loading: document.querySelector('#loading-state'),
  empty: document.querySelector('#empty-state'),
  emptyMessage: document.querySelector('#empty-message'),
  feedback: document.querySelector('#feedback'),
  search: document.querySelector('#search-input'),
  filter: document.querySelector('#status-filter'),
  taskModal: document.querySelector('#task-modal'),
  deleteModal: document.querySelector('#delete-modal'),
  form: document.querySelector('#task-form'),
  taskId: document.querySelector('#task-id'),
  title: document.querySelector('#title-input'),
  description: document.querySelector('#description-input'),
  status: document.querySelector('#task-status'),
  priority: document.querySelector('#task-priority'),
  descriptionCount: document.querySelector('#description-count'),
  modalTitle: document.querySelector('#modal-title'),
  modalEyebrow: document.querySelector('#modal-eyebrow'),
  saveButton: document.querySelector('#save-button'),
  deleteName: document.querySelector('#delete-task-name'),
  confirmDelete: document.querySelector('#confirm-delete-button'),
};

const state = { tasks: [], taskToDelete: null, searchTimer: null };
const statusLabels = { pending: 'Pendiente', 'in-progress': 'En progreso', completed: 'Completada' };
const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta' };

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error?.message || 'No fue posible completar la solicitud.');
    error.details = body.error?.details;
    throw error;
  }
  return body.data;
}

async function loadTasks() {
  setLoading(true);
  hideFeedback();
  const params = new URLSearchParams({ search: elements.search.value, status: elements.filter.value });
  try {
    state.tasks = await request(`/api/tasks?${params}`);
    renderTasks();
  } catch (error) {
    showFeedback(error.message);
    state.tasks = [];
    renderTasks();
  } finally {
    setLoading(false);
  }
}

function renderTasks() {
  elements.list.replaceChildren();
  elements.list.hidden = state.tasks.length === 0;
  elements.empty.hidden = state.tasks.length > 0;
  elements.emptyMessage.textContent = elements.search.value || elements.filter.value !== 'all'
    ? 'Prueba con otra búsqueda o cambia el filtro seleccionado.'
    : 'Crea tu primera tarea para comenzar a organizarte.';

  state.tasks.forEach((task) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    card.dataset.id = task.id;
    card.classList.toggle('task-card--completed', task.status === 'completed');
    card.querySelector('h2').textContent = task.title;
    const description = card.querySelector('p');
    description.textContent = task.description;
    description.hidden = !task.description;
    const badge = card.querySelector('.status-badge');
    badge.textContent = statusLabels[task.status];
    badge.classList.add(`status-badge--${task.status}`);
    const priority = task.priority || 'medium';
    const priorityBadge = card.querySelector('.priority-badge');
    priorityBadge.textContent = `Prioridad ${priorityLabels[priority].toLowerCase()}`;
    priorityBadge.classList.add(`priority-badge--${priority}`);
    const date = new Date(task.updatedAt);
    const time = card.querySelector('time');
    time.dateTime = task.updatedAt;
    time.textContent = `Actualizada ${new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(date)}`;
    card.querySelector('.task-card__check').addEventListener('click', () => toggleCompleted(task));
    card.querySelector('.edit-button').addEventListener('click', () => openTaskModal(task));
    card.querySelector('.delete-button').addEventListener('click', () => openDeleteModal(task));
    elements.list.append(card);
  });

  updateSummary();
}

function updateSummary() {
  const counts = state.tasks.reduce((result, task) => {
    result[task.status] += 1;
    return result;
  }, { pending: 0, 'in-progress': 0, completed: 0 });
  document.querySelector('#total-count').textContent = state.tasks.length;
  document.querySelector('#pending-count').textContent = counts.pending;
  document.querySelector('#progress-count').textContent = counts['in-progress'];
  document.querySelector('#completed-count').textContent = counts.completed;
}

function openTaskModal(task = null) {
  clearErrors();
  elements.form.reset();
  elements.taskId.value = task?.id || '';
  elements.title.value = task?.title || '';
  elements.description.value = task?.description || '';
  elements.status.value = task?.status || 'pending';
  elements.priority.value = task?.priority || 'medium';
  elements.modalEyebrow.textContent = task ? 'Editar tarea' : 'Nueva tarea';
  elements.modalTitle.textContent = task ? 'Actualizar tarea' : 'Agregar tarea';
  elements.saveButton.querySelector('.button__label').textContent = task ? 'Guardar cambios' : 'Guardar tarea';
  updateDescriptionCount();
  elements.taskModal.showModal();
  elements.title.focus();
}

async function saveTask(event) {
  event.preventDefault();
  clearErrors();
  const input = {
    title: elements.title.value,
    description: elements.description.value,
    status: elements.status.value,
    priority: elements.priority.value,
  };
  if (input.title.trim().length < 3) {
    showFieldErrors({ title: 'El título debe tener entre 3 y 80 caracteres.' });
    return;
  }

  setButtonLoading(elements.saveButton, true);
  const id = elements.taskId.value;
  try {
    await request(id ? `/api/tasks/${id}` : '/api/tasks', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(input),
    });
    elements.taskModal.close();
    await loadTasks();
    showFeedback(id ? 'La tarea fue actualizada.' : 'La tarea fue creada.', true);
  } catch (error) {
    if (error.details) showFieldErrors(error.details);
    else showFeedback(error.message);
  } finally {
    setButtonLoading(elements.saveButton, false);
  }
}

async function toggleCompleted(task) {
  try {
    await request(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        status: task.status === 'completed' ? 'pending' : 'completed',
        priority: task.priority || 'medium',
      }),
    });
    await loadTasks();
  } catch (error) {
    showFeedback(error.message);
  }
}

function openDeleteModal(task) {
  state.taskToDelete = task;
  elements.deleteName.textContent = `“${task.title}”`;
  elements.deleteModal.showModal();
}

async function deleteTask() {
  if (!state.taskToDelete) return;
  setButtonLoading(elements.confirmDelete, true);
  try {
    await request(`/api/tasks/${state.taskToDelete.id}`, { method: 'DELETE' });
    elements.deleteModal.close();
    state.taskToDelete = null;
    await loadTasks();
    showFeedback('La tarea fue eliminada.', true);
  } catch (error) {
    elements.deleteModal.close();
    showFeedback(error.message);
  } finally {
    setButtonLoading(elements.confirmDelete, false);
  }
}

function showFieldErrors(details) {
  Object.entries(details).forEach(([field, message]) => {
    const input = document.querySelector(`[name="${field}"]`);
    const error = document.querySelector(`#${field}-error`);
    input?.classList.add('input-error');
    if (error) error.textContent = message;
  });
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((item) => { item.textContent = ''; });
  document.querySelectorAll('.input-error').forEach((item) => item.classList.remove('input-error'));
}

function showFeedback(message, success = false) {
  elements.feedback.textContent = message;
  elements.feedback.classList.toggle('feedback--success', success);
  elements.feedback.hidden = false;
}

function hideFeedback() { elements.feedback.hidden = true; }
function setLoading(isLoading) { elements.loading.hidden = !isLoading; }
function setButtonLoading(button, loading) {
  button.disabled = loading;
  button.querySelector('.button__label').hidden = loading;
  button.querySelector('.button__loading').hidden = !loading;
}
function updateDescriptionCount() { elements.descriptionCount.textContent = `${elements.description.value.length}/300`; }
function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

document.querySelector('#open-create-button').addEventListener('click', () => openTaskModal());
document.querySelector('#empty-create-button').addEventListener('click', () => openTaskModal());
document.querySelector('#close-modal-button').addEventListener('click', () => elements.taskModal.close());
document.querySelector('#cancel-button').addEventListener('click', () => elements.taskModal.close());
document.querySelector('#cancel-delete-button').addEventListener('click', () => elements.deleteModal.close());
elements.confirmDelete.addEventListener('click', deleteTask);
elements.form.addEventListener('submit', saveTask);
elements.description.addEventListener('input', updateDescriptionCount);
elements.filter.addEventListener('change', loadTasks);
elements.search.addEventListener('input', () => {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(loadTasks, 250);
});
elements.taskModal.addEventListener('click', closeOnBackdrop);
elements.deleteModal.addEventListener('click', closeOnBackdrop);

loadTasks();
