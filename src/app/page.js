'use client';

import * as React from 'react';
import {
  Alert,
  AppBar,
  Button,
  Chip,
  CssBaseline,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Modal,
  Snackbar,
  SwipeableDrawer,
  TextField,
  Toolbar,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import classNames from 'classnames';
import { RecoilRoot, atom, useRecoilCallback, useRecoilState } from 'recoil';
import { FaBars, FaCheck, FaEllipsisV, FaTrash } from 'react-icons/fa';
import { FaPenToSquare } from 'react-icons/fa6';
import dateToStr from './dateUtil';
import RootTheme from './theme';
import Link from 'next/link';

const todoStateAtom = atom({
  key: 'app/todoStateAtom',
  default: {
    todos: [],
    lastTodoId: 0,
  },
});

function useTodosStatus() {
  const [{ todos, lastTodoId }, setTodoState] = useRecoilState(todoStateAtom);

  const resetTodos = React.useCallback(
    (newTodos) => {
      setTodoState((prev) => ({
        ...prev,
        todos: newTodos,
      }));
    },
    [setTodoState],
  );

  const resetLastTodoId = React.useCallback(
    (id) => {
      setTodoState((prev) => ({
        ...prev,
        lastTodoId: id,
      }));
    },
    [setTodoState],
  );

  const addTodo = useRecoilCallback(
    ({ snapshot, set }) =>
      (newContent) => {
        const content = newContent.trim();

        if (content.length === 0) {
          return null;
        }

        const currentState = snapshot.getLoadable(todoStateAtom).contents;
        const newTodoId = currentState.lastTodoId + 1;

        set(todoStateAtom, {
          lastTodoId: newTodoId,
          todos: [
            {
              id: newTodoId,
              content,
              regDate: dateToStr(new Date()),
            },
            ...currentState.todos,
          ],
        });

        return newTodoId;
      },
    [],
  );

  const removeTodo = React.useCallback(
    (id) => {
      setTodoState((prev) => ({
        ...prev,
        todos: prev.todos.filter((todo) => todo.id !== id),
      }));
    },
    [setTodoState],
  );

  const modifyTodo = React.useCallback(
    (id, content) => {
      const nextContent = content.trim();

      setTodoState((prev) => ({
        ...prev,
        todos: prev.todos.map((todo) =>
          todo.id !== id ? todo : { ...todo, content: nextContent },
        ),
      }));
    },
    [setTodoState],
  );

  const modifyTodoByIndex = React.useCallback(
    (index, newContent) => {
      const nextContent = newContent.trim();

      setTodoState((prev) => ({
        ...prev,
        todos: prev.todos.map((todo, _index) =>
          _index !== index ? todo : { ...todo, content: nextContent },
        ),
      }));
    },
    [setTodoState],
  );

  const modifyTodoById = React.useCallback(
    (id, newContent) => {
      const nextContent = newContent.trim();

      setTodoState((prev) => {
        const index = prev.todos.findIndex((todo) => todo.id === id);

        if (index === -1) {
          return prev;
        }

        return {
          ...prev,
          todos: prev.todos.map((todo, _index) =>
            _index !== index ? todo : { ...todo, content: nextContent },
          ),
        };
      });
    },
    [setTodoState],
  );

  const findTodoIndexById = React.useCallback(
    (id) => {
      return todos.findIndex((todo) => todo.id === id);
    },
    [todos],
  );

  const findTodoById = React.useCallback(
    (id) => {
      return todos.find((todo) => todo.id === id) ?? null;
    },
    [todos],
  );

  return {
    todos,
    lastTodoId,
    addTodo,
    removeTodo,
    modifyTodo,
    modifyTodoByIndex,
    modifyTodoById,
    findTodoIndexById,
    findTodoById,
    resetTodos,
    resetLastTodoId,
  };
}

function useTodoOptionDrawerStatus() {
  const [todoId, setTodoId] = React.useState(null);

  const open = React.useCallback((id) => {
    setTodoId(id);
  }, []);

  const close = React.useCallback(() => {
    setTodoId(null);
  }, []);

  return {
    todoId,
    open,
    close,
    opened: todoId !== null,
  };
}

function useEditTodoModalStatus() {
  const [opened, setOpened] = React.useState(false);

  const open = React.useCallback(() => {
    setOpened(true);
  }, []);

  const close = React.useCallback(() => {
    setOpened(false);
  }, []);

  return {
    opened,
    open,
    close,
  };
}

function useNoticeSnackbarStatus() {
  const [opened, setOpened] = React.useState(false);
  const [autoHideDuration, setAutoHideDuration] = React.useState(3000);
  const [variant, setVariant] = React.useState('filled');
  const [severity, setSeverity] = React.useState('success');
  const [msg, setMsg] = React.useState('');

  const open = React.useCallback(
    (nextMsg, nextSeverity = 'success', nextAutoHideDuration = 3000, nextVariant = 'filled') => {
      setOpened(true);
      setMsg(nextMsg);
      setSeverity(nextSeverity);
      setAutoHideDuration(nextAutoHideDuration);
      setVariant(nextVariant);
    },
    [],
  );

  const close = React.useCallback(() => {
    setOpened(false);
  }, []);

  return {
    opened,
    open,
    close,
    autoHideDuration,
    variant,
    severity,
    msg,
  };
}

function NoticeSnackbar({ status }) {
  return (
    <Snackbar
      open={status.opened}
      autoHideDuration={status.autoHideDuration}
      onClose={status.close}>
      <Alert variant={status.variant} severity={status.severity} onClose={status.close}>
        {status.msg}
      </Alert>
    </Snackbar>
  );
}

function NewTodoForm({ noticeSnackbarStatus }) {
  const todosStatus = useTodosStatus();

  const onSubmit = (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const content = form.content.value.trim();

    if (content.length === 0) {
      window.alert('할 일을 입력해');
      form.content.focus();
      return;
    }

    const newTodoId = todosStatus.addTodo(content);

    form.content.value = '';
    form.content.focus();

    if (newTodoId !== null) {
      noticeSnackbarStatus.open(`${newTodoId}번 todo 추가됨`);
    }
  };

  return (
    <form className="tw-flex tw-flex-col tw-gap-2 tw-p-4" onSubmit={onSubmit}>
      <TextField
        multiline
        maxRows={4}
        name="content"
        label="할 일 입력"
        variant="outlined"
        autoComplete="off"
      />
      <Button className="tw-font-bold" variant="contained" type="submit">
        추가
      </Button>
    </form>
  );
}

function TodoListItem({ todo, index, openDrawer }) {
  return (
    <li className="tw-mb-3">
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2">
        <div className="tw-flex tw-gap-x-2 tw-font-bold">
          <Chip className="tw-pt-[3px]" label={`번호 : ${todo.id}`} variant="outlined" />
          <Chip
            className="tw-pt-[3px]"
            label={`날짜 : ${todo.regDate}`}
            variant="outlined"
            color="primary"
          />
        </div>

        <div className="tw-flex tw-min-h-[80px] tw-rounded-[10px] tw-shadow">
          <Button className="tw-flex-shrink-0 tw-rounded-[10px_0_0_10px]" color="inherit">
            <FaCheck
              className={classNames('tw-text-3xl', {
                'tw-text-[--mui-color-primary-main]': index % 2 === 0,
                'tw-text-[#dcdcdc]': index % 2 !== 0,
              })}
            />
          </Button>

          <div className="tw-h-[60px] tw-w-[2px] tw-self-center tw-bg-[#dcdcdc]" />

          <div className="tw-flex tw-flex-grow tw-items-center tw-whitespace-pre-wrap tw-break-words tw-bg-blue-300 tw-p-3 tw-leading-relaxed hover:tw-text-[--mui-color-primary-main]">
            할 일 : {todo.content}
          </div>

          <Button
            onClick={() => openDrawer(todo.id)}
            className="tw-flex-shrink-0 tw-rounded-[0_10px_10px_0]"
            color="inherit">
            <FaEllipsisV className="tw-text-2xl tw-text-[#dcdcdc]" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function EditTodoModal({ status, todo, noticeSnackbarStatus }) {
  const todosStatus = useTodosStatus();
  const [content, setContent] = React.useState('');

  React.useEffect(() => {
    if (status.opened) {
      setContent(todo?.content ?? '');
    }
  }, [status.opened, todo]);

  const onSubmit = (e) => {
    e.preventDefault();

    const nextContent = content.trim();

    if (nextContent.length === 0) {
      window.alert('할 일을 입력해');
      return;
    }

    if (!todo) {
      status.close();
      return;
    }

    todosStatus.modifyTodo(todo.id, nextContent);
    status.close();
    noticeSnackbarStatus.open(`${todo.id}번 todo 수정됨`);
  };

  return (
    <Modal
      open={status.opened}
      onClose={status.close}
      className="tw-flex tw-items-center tw-justify-center">
      <div className="tw-w-full tw-max-w-lg tw-rounded-[20px] tw-bg-white tw-p-10">
        <form onSubmit={onSubmit} className="tw-flex tw-flex-col tw-gap-2">
          <TextField
            minRows={3}
            maxRows={10}
            multiline
            name="content"
            autoComplete="off"
            variant="outlined"
            label="할 일 써"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button variant="contained" className="tw-font-bold" type="submit">
            수정
          </Button>
        </form>
      </div>
    </Modal>
  );
}

function TodoOptionDrawer({ status, noticeSnackbarStatus }) {
  const todosStatus = useTodosStatus();
  const editTodoModalStatus = useEditTodoModalStatus();
  const todo = todosStatus.findTodoById(status.todoId);

  const removeTodo = () => {
    if (status.todoId === null) {
      status.close();
      return;
    }

    const confirmed = window.confirm(`${status.todoId}번 할 일을 삭제하시겠습니까?`);

    if (!confirmed) {
      status.close();
      return;
    }

    todosStatus.removeTodo(status.todoId);
    status.close();
    noticeSnackbarStatus.open(`${status.todoId}번 todo 삭제됨`, 'error');
  };

  const openEditModal = () => {
    if (!todo) {
      status.close();
      return;
    }

    status.close();
    editTodoModalStatus.open();
  };

  return (
    <>
      <EditTodoModal
        status={editTodoModalStatus}
        todo={todo}
        noticeSnackbarStatus={noticeSnackbarStatus}
      />

      <SwipeableDrawer anchor="top" open={status.opened} onClose={status.close} onOpen={() => {}}>
        <List>
          <ListItem className="tw-flex tw-gap-2 tw-p-[15px]">
            <span className="tw-text-[--mui-color-primary-main]">
              {todo ? `${todo.id}번` : '선택된 todo 없음'}
            </span>
            <span>Your Todo</span>
          </ListItem>

          <Divider className="tw-my-[5px]" />

          <ListItemButton
            onClick={openEditModal}
            className="tw-flex tw-items-center tw-gap-2 tw-p-[15px_20px]">
            <span>수정</span>
            <FaPenToSquare className="tw-mt-[-5px] block" />
          </ListItemButton>

          <ListItemButton
            className="tw-flex tw-items-center tw-gap-2 tw-p-[15px_20px]"
            onClick={removeTodo}>
            <span>삭제</span>
            <FaTrash className="tw-mt-[-5px] block" />
          </ListItemButton>
        </List>
      </SwipeableDrawer>
    </>
  );
}

function TodoList({ noticeSnackbarStatus }) {
  const todosStatus = useTodosStatus();
  const todoOptionDrawerStatus = useTodoOptionDrawerStatus();

  return (
    <>
      <TodoOptionDrawer
        status={todoOptionDrawerStatus}
        noticeSnackbarStatus={noticeSnackbarStatus}
      />

      <nav className="tw-px-4">
        <div className="tw-mb-3 tw-font-semibold">할 일 갯수 : {todosStatus.todos.length}</div>

        <ul>
          {todosStatus.todos.map((todo, index) => (
            <TodoListItem
              key={todo.id}
              todo={todo}
              index={index}
              openDrawer={todoOptionDrawerStatus.open}
            />
          ))}
        </ul>
      </nav>
    </>
  );
}

function App() {
  const { resetTodos, resetLastTodoId, addTodo } = useTodosStatus();
  const noticeSnackbarStatus = useNoticeSnackbarStatus();

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    resetTodos([]);
    resetLastTodoId(0);

    addTodo('스쿼트');
    addTodo('벤치프레스');
    addTodo('데드리프트\n런지');
  }, [addTodo, resetLastTodoId, resetTodos]);

  const handleMenuClick = () => {
    noticeSnackbarStatus.open('메뉴 기능은 아직 준비 중입니다.', 'info');
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <div className="tw-flex-1">
            <FaBars onClick={handleMenuClick} className="tw-cursor-pointer" />
          </div>

          <div className="logo-box">
            <Link href="/" className="tw-font-bold">
              로고
            </Link>
          </div>

          <div className="tw-flex tw-flex-1 tw-justify-end">글쓰기</div>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <NoticeSnackbar status={noticeSnackbarStatus} />
      <NewTodoForm noticeSnackbarStatus={noticeSnackbarStatus} />
      <TodoList noticeSnackbarStatus={noticeSnackbarStatus} />
    </>
  );
}

export default function ThemeApp() {
  const theme = RootTheme();

  return (
    <RecoilRoot>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </RecoilRoot>
  );
}
