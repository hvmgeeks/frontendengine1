import { message, Table } from "antd";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getAllUsers,
  blockUserById,
  deleteUserById,
} from "../../../apicalls/users";
import PageTitle from "../../../components/PageTitle";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { MdDelete } from "react-icons/md";

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = React.useState([]);
  const dispatch = useDispatch();

  const getUsersData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllUsers();
      dispatch(HideLoading());
      if (response.success) {
        setUsers(response.users);
        console.log("users", response);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };
  const blockUser = async (studentId) => {
    try {
      dispatch(ShowLoading());
      const response = await blockUserById({
        studentId,
      });
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        getUsersData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const deleteUser = async (studentId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteUserById({ studentId });
      dispatch(HideLoading());
      if (response.success) {
        message.success("User deleted successfully");
        getUsersData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "School",
      dataIndex: "school",
    },
    {
      title: "Class",
      dataIndex: "class",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <div className="flex items-center justify-between ">
          <button onClick={() => blockUser(record.studentId)}>
            {record.isBlocked ? "Unblock" : "Block"}
          </button>

          <span
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this user?")
              ) {
                deleteUser(record.studentId);
              }
            }}
            style={{ color: "red", cursor: "pointer" }}
            className="cursor-pointer"
          >
            <MdDelete fontSize={20} />
          </span>
        </div>
      ),
    },
  ];
  useEffect(() => {
    getUsersData();
  }, []);
  return (
    <div>
      <div className="flex justify-between mt-2 items-end">
        <PageTitle title="Users" />
      </div>
      <div className="divider"></div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey={(record) => record.studentId}
      />
    </div>
  );
}

export default Users;
