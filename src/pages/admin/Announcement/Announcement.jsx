import React, { useEffect, useState } from "react";
import { message, Modal, Input } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  addAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "../../../apicalls/announcements";
import "./announcement.css"; // your custom styles
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { useDispatch } from "react-redux";

export default function Announcement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ heading: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  const dispatch = useDispatch();

  const fetchAll = async () => {
    dispatch(ShowLoading());
    const res = await getAnnouncements();
    dispatch(HideLoading());
    if (res.success !== false) setList(res);
    else message.error(res.error || "Failed to load announcements");
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAddModal = () => {
    setForm({ heading: "", description: "" });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (announcement) => {
    setForm({
      heading: announcement.heading,
      description: announcement.description,
    });
    setEditingId(announcement._id);
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (!form.heading || !form.description) {
      return message.warning("Heading and Description are required");
    }
    dispatch(ShowLoading());

    setLoading(true);
    const res = editingId
      ? await updateAnnouncement(editingId, form)
      : await addAnnouncement(form);
    setLoading(false);

    if (res.success === false)
      return message.error(res.error || "Operation failed");

    message.success(editingId ? "Announcement updated" : "Announcement added");
    setModalOpen(false);
    setForm({ heading: "", description: "" });
    setEditingId(null);
    fetchAll();
    dispatch(HideLoading());

  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    dispatch(ShowLoading());
    const res = await deleteAnnouncement(id);
    dispatch(HideLoading());

    if (res.success === false)
      return message.error(res.error || "Delete failed");
    message.success("Announcement deleted");
    fetchAll();
  };

  return (
    <div className="announcement-admin">
      <div className="admin-header">
        <h2>Manage Announcements</h2>
        <button onClick={openAddModal} className="add-btn">
          <PlusOutlined />
          <span>Add Announcement</span>
        </button>
      </div>

      {list.length === 0 ? (
        <p className="no-announcements">No announcements yet.</p>
      ) : (
        <div className="announcement-list">
          {list.map((item) => (
            <div className="announcement-card" key={item._id}>
              <div className="announcement-content">
                <h3>{item.heading}</h3>
                <p>{item.description}</p>
              </div>
              <div className="card-actions">
                <button
                  onClick={() => openEditModal(item)}
                  className="edit-btn"
                  title="Edit"
                >
                  <EditOutlined />
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="delete-btn"
                  title="Delete"
                >
                  <DeleteOutlined />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit */}
      <Modal
        title={editingId ? "Edit Announcement" : "Add Announcement"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalSubmit}
        okText={editingId ? "Update" : "Add"}
        confirmLoading={loading}
      >
        <div className="modal-form">
          <input
            type="text"
            placeholder="Heading"
            style={{ borderRadius: "5px" }}
            value={form.heading}
            onChange={(e) => setForm({ ...form, heading: e.target.value })}
          />
          <Input.TextArea
            placeholder="Description"
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </div>
      </Modal>
    </div>
  );
}
