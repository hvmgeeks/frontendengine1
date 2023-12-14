import React, { useState, useEffect } from "react";
import './index.css';
import { getStudyMaterial } from "../../../apicalls/study";
import YouTube from 'react-youtube';

function StudyMaterial() {
  const [content, setContent] = useState('default');
  const [userClass, setUserClass] = useState('default');
  const [subject, setSubject] = useState('default');
  const [notes, setNotes] = useState('');
  const [pastPapers, setPastPapers] = useState('');
  const [videos, setVideos] = useState('');
  const [showVideoID, setShowVideoID] = useState('');
  const classesList = ['Class 3', 'Class 4', 'Class 5', 'Class 6', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  const subjectsList = ['Mathematics', 'Science', 'Kiswahili', 'English', 'SocialStudies', 'Civic&Moral', 'Religion', 'VS'];

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
    else {
      if (res.status === 200) {
        setVideos(res.data);
      }
      else {
        setVideos('empty');
      }
    }
    console.log('Response', res);
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
    setShowVideoID('');
    setContent(e.target.value);
    setUserClass('default');
    setSubject('default');
  }

  const handleClassChange = (e) => {
    setNotes('');
    setPastPapers('');
    setVideos('');
    setShowVideoID('');
    setUserClass(e.target.value);
    setSubject('default');
  }

  const handleSubjectChange = (e) => {
    setNotes('');
    setPastPapers('');
    setVideos('');
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

  return (
    <div className="study-material">
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
          {notes !== 'empty' ?
            <div>
              {notes.map((note, index) => (
                <div className="note common" key={index}>
                  <div className="title"><b>Title: </b>{note.title}</div>
                  <button className="btn" onClick={(e) => handleDocumentDownload(note.documentID)}>Download PDF</button>
                </div>
              ))
              }
            </div>
            :
            <div className="not-found">
              Notes Not Found!
            </div>
          }
        </>
      }
      {pastPapers &&
        <>
          {pastPapers !== 'empty' ?
            <div>
              {pastPapers.map((paper, index) => (
                <div className="paper common" key={index}>
                  <div className="title"><b>Title: </b>{paper.title}</div>
                  <div className="year"><b>Year: </b>{paper.year}</div>
                  <button className="btn" onClick={(e) => handleDocumentDownload(paper.documentID)}>Download PDF</button>
                </div>
              ))
              }
            </div>
            :
            <div className="not-found">
              Past Papers Not Found!
            </div>
          }
        </>
      }
      {videos &&
        <>
          {videos !== 'empty' ?
            <div>
              {videos.map((video, index) => (
                <div className="video common" key={index}>
                  <div className="title"><b>Title: </b>{video.title}</div>
                  {showVideoID !== video.videoID ?
                    <button className="btn" onClick={(e) => handleWatchVideo(video.videoID)}>Watch Video</button>
                    :
                    <YouTube videoId={video.videoID} opts={opts} />
                  }
                </div>
              ))
              }
            </div>
            :
            <div className="not-found">
              Videos Not Found!
            </div>
          }
        </>
      }
    </div>
  );
}

export default StudyMaterial;