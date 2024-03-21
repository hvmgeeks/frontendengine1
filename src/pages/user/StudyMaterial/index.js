import React, { useState, useEffect } from "react";
import './index.css';
import { getStudyMaterial } from "../../../apicalls/study";
import PageTitle from "../../../components/PageTitle";
import YouTube from 'react-youtube';
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";

function StudyMaterial() {
  const [content, setContent] = useState('default');
  const [userClass, setUserClass] = useState('default');
  const [subject, setSubject] = useState('default');
  const [notes, setNotes] = useState('');
  const [pastPapers, setPastPapers] = useState('');
  const [videos, setVideos] = useState('');
  const [books, setBooks] = useState('');
  const [showVideoID, setShowVideoID] = useState('');
  const classesList = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7',];
  const subjectsList = ['Mathematics', 'Science', 'Kiswahili', 'English', 'SocialStudies', 'Civic&Moral', 'Religion', 'VS'];
  const dispatch = useDispatch();

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0, // Set to 1 if you want videos to autoplay
    },
  };

  const fetchMaterial = async () => {
    if (content === 'default' || userClass === 'default' || subject === 'default') {
      return;
    }
    const data = {
      content,
      className: userClass,
      subject
    }
    dispatch(ShowLoading());
    const res = await getStudyMaterial(data);
    if (data.content === 'study-notes') {
      if (res.status === 200) {
        setNotes(res.data);
      }
      else {
        setNotes('empty');
      }
    }
    else if (data.content === 'past-papers') {
      if (res.status === 200) {
        setPastPapers(res.data);
      }
      else {
        setPastPapers('empty');
      }
    }
    else if (data.content === 'videos') {
      if (res.status === 200) {
        setVideos(res.data);
      }
      else {
        setVideos('empty');
      }
    }
    else if (data.content === 'books') {
      if (res.status === 200) {
        setBooks(res.data);
      }
      else {
        setBooks('empty');
      }
    }
    dispatch(HideLoading());
  }

  useEffect(() => {
    if (subject !== 'default') {
      fetchMaterial();
    }

  }, [subject]);

  const handleContentChange = (e) => {
    setNotes('');
    setPastPapers('');
    setVideos('');
    setBooks('');
    setShowVideoID('');
    setContent(e.target.value);
    setUserClass('default');
    setSubject('default');
  }

  const handleClassChange = (e) => {
    setNotes('');
    setPastPapers('');
    setVideos('');
    setBooks('');
    setShowVideoID('');
    setUserClass(e.target.value);
    setSubject('default');
  }

  const handleSubjectChange = (e) => {
    setNotes('');
    setPastPapers('');
    setVideos('');
    setBooks('');
    setShowVideoID('');
    setSubject(e.target.value);
  }

  const handleDocumentDownload = (id) => {
    const pdfUrl = `https://drive.google.com/uc?export=download&id=${id}`;
    window.open(pdfUrl, '_blank');
  };

  const handleWatchVideo = (id) => {
    setShowVideoID(id);
  }

  const handleDocumentPreview = (id) => {
    const viewerUrl = `https://drive.google.com/file/d/${id}/view`;

    // Open the preview in a new window or tab
    window.open(viewerUrl, '_blank');
  }

  return (
    <div className="study-material">
      <PageTitle title="Study Material" />
      <div className="divider"></div>
      <div className="content">
        <label htmlFor="study-content">
          Please Select Content:
          <select id="study-content" value={content} onChange={handleContentChange}>
            <option disabled={true} value='default'>
              Select Content
            </option>
            <option value='past-papers'>
              Past Papers
            </option>
            <option value='study-notes'>
              Study Notes
            </option>
            <option value='videos'>
              Videos
            </option>
            <option value='books'>
              Books
            </option>
          </select>
        </label>
      </div>
      {content !== 'default' &&
        <div className="class">
          <label htmlFor="class-name">
            Please Select Class:
            <select id="class-name" value={userClass} onChange={handleClassChange}>
              <option disabled={true} value='default'>
                Select Class
              </option>
              {classesList.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))
              }
            </select>
          </label>
        </div>
      }
      {userClass !== 'default' &&
        <div className="subject">
          <label htmlFor="subject-name">
            Please Select Subject:
            <select id="subject-name" value={subject} onChange={handleSubjectChange}>
              <option disabled={true} value='default'>
                Select Subject
              </option>
              {subjectsList.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))
              }
            </select>
          </label>
        </div>
      }
      {notes &&
        <>
          {notes !== 'empty' && (
            <div className="flex gap-5">
              {notes.map((note, index) => (
                <div className="note common" key={index}>
                  <div className="title"><b>Title: </b>{note.title}</div>
                  <div className="button-container">
                    <button className="btn" onClick={(e) => handleDocumentPreview(note.documentID)}>View PDF</button>
                    <button className="btn" onClick={(e) => handleDocumentDownload(note.documentID)}>Download PDF</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {notes === 'empty' && (
            <div className="not-found">
              Notes Are Uploading Now!
            </div>
          )}
        </>
      }
      {pastPapers &&
        <>
          {pastPapers !== 'empty' && (
            <div className="flex gap-5">
              {pastPapers.map((paper, index) => (
                <div className="paper common" key={index}>
                  <div className="title"><b>Title: </b>{paper.title}</div>
                  <div className="year"><b>Year: </b>{paper.year}</div>
                  <div className="button-container">
                    <button className="btn" onClick={(e) => handleDocumentPreview(paper.documentID)}>View PDF</button>
                    <button className="btn" onClick={(e) => handleDocumentDownload(paper.documentID)}>Download PDF</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pastPapers === 'empty' && (
            <div className="not-found">
              Past Papers Are Uploading!
            </div>
          )}
        </>
      }
      {videos &&
        <>
          {videos !== 'empty' && (
            <div className="">
              {videos.map((video, index) => (
                <div className="video common" key={index}>
                  <div className="title"><b>Title: </b>{video.title}</div>
                  {showVideoID !== video.videoID ? (
                    <button className="btn" onClick={(e) => handleWatchVideo(video.videoID)}>Watch Video</button>
                  ) : (
                    <YouTube videoId={video.videoID} opts={opts} />
                  )}
                </div>
              ))}
            </div>
          )}
          {videos === 'empty' && (
            <div className="not-found">
              Videos Are Uploading Now!
            </div>
          )}
        </>
      }
      {books &&
        <>
          {books !== 'empty' && (
            <div className="flex gap-5">
              {books.map((book, index) => (
                <div className="books common" key={index}>
                  <div className="title"><b>Title: </b>{book.title}</div>
                  <div className="year"><b>Year: </b>{book.year}</div>
                  <div className="thumbnail-container">
                    <img className="thumbnail" onClick={(e) => handleDocumentPreview(book.documentID)} src={book.thumbnail} />
                    <div className="button-container">
                      <button className="btn" onClick={(e) => handleDocumentPreview(book.documentID)}>View PDF</button>
                      <button className="btn" onClick={(e) => handleDocumentDownload(book.documentID)}>Download PDF</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {books === 'empty' && (
            <div className="not-found">
              Books Are uploading Now!
            </div>
          )}
        </>
      }

    </div>
  );
}

export default StudyMaterial;
