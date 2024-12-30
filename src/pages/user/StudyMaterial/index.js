import React, { useState, useEffect } from "react";
import "./index.css";
import { getStudyMaterial } from "../../../apicalls/study";
import PageTitle from "../../../components/PageTitle";
import YouTube from "react-youtube";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import Modal from "react-modal";
import PDFModal from "./PDFModal";
import { FaPlayCircle } from "react-icons/fa";

function StudyMaterial() {
  const [content, setContent] = useState("default");
  const [userClass, setUserClass] = useState("default");
  const [subject, setSubject] = useState("default");
  const [notes, setNotes] = useState("");
  const [pastPapers, setPastPapers] = useState("");
  const [videos, setVideos] = useState("");
  const [books, setBooks] = useState("");
  const [showVideoURL, setShowVideoURL] = useState("");
  const user = useSelector((state) => state.users.user);
  const [showVideoIndices, setShowVideoIndices] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState("");

  const handleShowVideo = (index) => {
    setShowVideoIndices((prevIndices) => [...prevIndices, index]);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setDocumentUrl("");
  };

  const handleHideVideo = (index) => {
    setShowVideoIndices((prevIndices) =>
      prevIndices.filter((i) => i !== index)
    );
  };
  const primaryClasses = ["1", "2", "3", "4", "5", "6", "7"];
  const secondaryClasses = [
    "Form-1",
    "Form-2",
    "Form-3",
    "Form-4",
    "Form-5",
    "Form-6",
  ];

  const userSchoolType = user?.schoolType;

  const classesList =
    userSchoolType === "primary" ? primaryClasses : secondaryClasses;

  const subjectsList = [
    "Mathematics",
    "Science",
    "Kiswahili",
    "English",
    "SocialStudies",
    "Civic&Moral",
    "Religion",
    "VS",
  ];
  const dispatch = useDispatch();

  const opts = {
    height: "390",
    width: "640",
    playerVars: {
      autoplay: 0, // Set to 1 if you want videos to autoplay
    },
  };

  const fetchMaterial = async () => {
    if (
      content === "default" ||
      userClass === "default" ||
      subject === "default"
    ) {
      return;
    }
    const data = {
      content,
      className: userClass,
      subject,
    };
    if (userSchoolType) {
      data.schoolType = userSchoolType;
    }
    dispatch(ShowLoading());
    const res = await getStudyMaterial(data);
    if (data.content === "study-notes") {
      if (res.status === 200) {
        setNotes(res.data);
      } else {
        setNotes("empty");
      }
    } else if (data.content === "past-papers") {
      if (res.status === 200) {
        setPastPapers(res.data);
      } else {
        setPastPapers("empty");
      }
    } else if (data.content === "videos") {
      if (res.status === 200) {
        setVideos(res.data);
      } else {
        setVideos("empty");
      }
    } else if (data.content === "books") {
      if (res.status === 200) {
        setBooks(res.data);
      } else {
        setBooks("empty");
      }
    }
    dispatch(HideLoading());
  };

  useEffect(() => {
    if (subject !== "default") {
      fetchMaterial();
    }
  }, [subject]);

  const handleContentChange = (e) => {
    setNotes("");
    setPastPapers("");
    setVideos("");
    setBooks("");
    setShowVideoURL("");
    setContent(e.target.value);
    setUserClass("default");
    setSubject("default");
  };

  const handleClassChange = (e) => {
    setNotes("");
    setPastPapers("");
    setVideos("");
    setBooks("");
    setShowVideoURL("");
    setUserClass(e.target.value);
    setSubject("default");
  };

  const handleSubjectChange = (e) => {
    setNotes("");
    setPastPapers("");
    setVideos("");
    setBooks("");
    setShowVideoURL("");
    setSubject(e.target.value);
  };

  const handleDocumentDownload = (documentUrl) => {
    fetch(documentUrl) // Fetch the file from the provided URL
      .then((response) => response.blob()) // Convert the response to a Blob
      .then((blob) => {
        const url = window.URL.createObjectURL(blob); // Create a URL for the Blob
        const a = document.createElement("a"); // Create an anchor element
        a.href = url; // Set the href to the Blob URL
        a.download = documentUrl.split("/").pop(); // Use the file name from the URL
        document.body.appendChild(a); // Append anchor to body
        a.click(); // Trigger the download by simulating a click
        document.body.removeChild(a); // Remove the anchor element
        window.URL.revokeObjectURL(url); // Clean up the Blob URL
      })
      .catch((error) => {
        console.error("Error downloading the file:", error);
      });
  };

  const handleDocumentPreview = (url) => {
    setDocumentUrl(url);
    setModalIsOpen(true);
  };

  return (
    <div className="study-material">
      <PageTitle title="Study Material" />
      <div className="divider"></div>
      <div className="content">
        <label htmlFor="study-content">
          Please Select Content:
          <select
            id="study-content"
            value={content}
            onChange={handleContentChange}
          >
            <option disabled={true} value="default">
              Select Content
            </option>
            <option value="past-papers">Past Papers</option>
            <option value="study-notes">Study Notes</option>
            <option value="videos">Videos</option>
            <option value="books">Books</option>
          </select>
        </label>
      </div>
      {content !== "default" && (
        <div className="class">
          <label htmlFor="class-name">
            Please Select Class:
            <select
              id="class-name"
              value={userClass}
              onChange={handleClassChange}
            >
              <option disabled={true} value="default">
                Select Class
              </option>
              {classesList.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {userClass !== "default" && (
        <div className="subject">
          <label htmlFor="subject-name">
            Please Select Subject:
            <select
              id="subject-name"
              value={subject}
              onChange={handleSubjectChange}
            >
              <option disabled={true} value="default">
                Select Subject
              </option>
              {subjectsList.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {notes && (
        <>
          {notes !== "empty" && (
            <div className="flex gap-5">
              {notes.map((note, index) => (
                <div className="note common" key={index}>
                  <div className="title">
                    <b>Title: </b>
                    {note.title}
                  </div>
                  {note.documentUrl ? (
                    <div className="button-container">
                      <button
                        className="btn"
                        onClick={(e) => handleDocumentPreview(note.documentUrl)}
                      >
                        View PDF
                      </button>
                      <button
                        className="btn"
                        onClick={(e) =>
                          handleDocumentDownload(note.documentUrl)
                        }
                      >
                        Download PDF
                      </button>
                    </div>
                  ) : (
                    "No Document"
                  )}
                </div>
              ))}
            </div>
          )}
          {notes === "empty" && (
            <div className="not-found">Notes Not Found!</div>
          )}
        </>
      )}
      {pastPapers && (
        <>
          {pastPapers !== "empty" && (
            <div className="flex gap-5">
              {pastPapers.map((paper, index) => (
                <div className="paper common" key={index}>
                  <div className="title">
                    <b>Title: </b>
                    {paper.title}
                  </div>
                  <div className="year">
                    <b>Year: </b>
                    {paper.year}
                  </div>
                  {paper.documentUrl ? (
                    <div className="button-container">
                      <button
                        className="btn"
                        onClick={(e) =>
                          handleDocumentPreview(paper.documentUrl)
                        }
                      >
                        View PDF
                      </button>
                      <button
                        className="btn"
                        onClick={(e) =>
                          handleDocumentDownload(paper.documentUrl)
                        }
                      >
                        Download PDF
                      </button>
                    </div>
                  ) : (
                    "No documentUrl"
                  )}
                </div>
              ))}
            </div>
          )}
          {pastPapers === "empty" && (
            <div className="not-found">Past Papers Not Found!</div>
          )}
        </>
      )}
      {videos && (
        <>
          {videos !== "empty" && (
            <div className="">
              {videos.map((video, index) => (
                <div className="video common" key={index}>
                  <div className="title">
                    <b>Title: </b>
                    {video.title}
                  </div>
                  {!showVideoIndices.includes(index) ? (
                    <div className="flex items-center">
                      <div style={{ width: "100%" }}>
                        <div style={{ position: "relative", widows: "400px" }}>
                          <img
                            src={video.thumbnail}
                            alt={`Thumbnail for ${video.title}`}
                            className="video-thumbnail cursor-pointer"
                            onClick={() => handleShowVideo(index)}
                            style={{ width: "400px", height: "227px" }}
                          />
                          <div
                            className="play-button"
                            onClick={() => handleShowVideo(index)}
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "200px",
                              transform: "translate(-50%, -50%)",
                              cursor: "pointer",
                            }}
                          >
                            <FaPlayCircle fontSize={50} color="#0F3460" />
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn mt-2 "
                        onClick={() => handleShowVideo(index)}
                      >
                        Watch Video
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div>
                        <video
                          controls
                          width="400px"
                          src={video.videoUrl}
                          className="mt-2"
                          autoPlay={true}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <button
                        className="btn mt-2"
                        onClick={() => handleHideVideo(index)}
                      >
                        Close Video
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {videos === "empty" && (
            <div className="not-found">Videos Not Found!</div>
          )}
        </>
      )}
      {books && (
        <>
          {books !== "empty" && (
            <div className="flex gap-5">
              {books.map((book, index) => (
                <div className="books common" key={index}>
                  <div className="title">
                    <b>Title: </b>
                    {book.title}
                  </div>
                  <div className="year">
                    <b>Year: </b>
                    {book.year}
                  </div>
                  {book.thumbnail &&
                    <div className="thumbnail-container">
                      <img src={book.thumbnail} alt="book-thumbnail" className="thumbnail" />
                    </div>
                  }
                  {book.documentUrl ? (
                    <div className="thumbnail-container">
                      <div className="button-container">
                        <button
                          className="btn"
                          onClick={(e) =>
                            handleDocumentPreview(book.documentUrl)
                          }
                        >
                          View PDF
                        </button>
                        <button
                          className="btn"
                          onClick={(e) =>
                            handleDocumentDownload(book.documentUrl)
                          }
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    "No documentUrl"
                  )}
                </div>
              ))}
            </div>
          )}
          {books === "empty" && (
            <div className="not-found">Books Not Found!</div>
          )}
        </>
      )}

      <PDFModal
        modalIsOpen={modalIsOpen}
        closeModal={closeModal}
        documentUrl={documentUrl}
      />
    </div>
  );
}

export default StudyMaterial;
