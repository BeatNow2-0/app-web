import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rightarrow from '../../assets/siguiente-pista.png';
import './Upload.css';
import GlobalSelect from '../../components/Select/GlobalSelect';
import axios from 'axios';
import CustomPopup from '../../components/Popup/CustomPopup';
import { TagsInput } from 'react-tag-input-component';
import Header from '../../Layout/Header/Header';
import { useSpring, animated } from '@react-spring/web';
import Loading from '../../components/Loading/Loading';
import { buildApiUrl } from '../../config/apiConfig';
import { genresList, instrumentsList, moodsList } from '../../constants/beatFormOptions';

interface Beat {
  beatUsername: string;
  beatFile: File | null;
  beatTitle: string;
  beatBpm: number;
  beatTags: string[];
  beatMoods: string[];
  beatGenre: string;
  beatInstruments: string[];
  beatDescription: string;
  beatPic: File | null;
}

const SUPPORTED_AUDIO_TYPES = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];
const SUPPORTED_IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/jpg', 'image/png'];

function Upload() {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const maxBPM = 500;
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [bpmValue, setBpmValue] = useState('');
  const [username, setUsername] = useState('');
  const [selectedMusicFile, setSelectedMusicFile] = useState<File | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [tokenExists, setTokenExists] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [noCopyrightInfringement, setNoCopyrightInfringement] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [selectedImgFile, setSelectedImgFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [moods, setMoods] = useState<string[]>([]);
  const [successfulUpload, setSuccessfulUpload] = useState(false);
  const [beat, setBeat] = useState<Beat>({
    beatUsername: '',
    beatFile: null,
    beatTitle: '',
    beatBpm: 0,
    beatTags: [],
    beatMoods: [],
    beatGenre: '',
    beatInstruments: [],
    beatDescription: '',
    beatPic: null,
  });
  const [next, setNext] = useState(false);
  const [dragTarget, setDragTarget] = useState<'audio' | 'cover' | null>(null);

  const navigate = useNavigate();
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedGenre = localStorage.getItem('genre');
    const savedMoods = JSON.parse(localStorage.getItem('moods') || '[]');
    const savedInstruments = JSON.parse(localStorage.getItem('instruments') || '[]');

    setGenre(savedGenre || '');
    setMoods(savedMoods);
    setInstruments(savedInstruments);
  }, []);

  const slideAnimationInitial = useSpring({
    transform: next ? 'translate3d(-100%, 0, 0)' : 'translate3d(0%, 0, 0)',
    config: { tension: 210, friction: 20 },
  });

  const slideAnimationNext = useSpring({
    transform: next ? 'translate3d(0%, 0, 0)' : 'translate3d(100%, 0, 0)',
    config: { tension: 210, friction: 20 },
  });

  const spring = useSpring({
    to: { transform: `translateX(${activeTab * 100}%)` },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    const url = buildApiUrl('/v1/api/users/users/me');
    const headers = {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
    axios
      .get(url, { headers })
      .then((response) => {
        if (response.status === 200) {
          setUsername(response.data.username);
          console.log('Información del usuario:', response.data);
        }
      })
      .catch(() => {
        console.error('Error al obtener la información del usuario.');
        setTokenExists(false);
        setShowPopup(true);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    if (submitted) {
      console.log(beat);
      localStorage.setItem('beat', JSON.stringify(beat));
    }
  }, [beat, submitted]);

  useEffect(() => {
    setBeat((prevBeat) => ({
      ...prevBeat,
      beatDescription: description,
    }));
  }, [description]);

  useEffect(() => {
    setBeat((prevBeat) => ({
      ...prevBeat,
      beatMoods: moods,
      beatGenre: genre,
      beatInstruments: instruments,
    }));
  }, [moods, genre, instruments]);

  const imagePreviewUrl = useMemo(
    () => (selectedImgFile ? URL.createObjectURL(selectedImgFile) : null),
    [selectedImgFile],
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleSubmit1 = (event: FormEvent) => {
    event.preventDefault();

    if (validateForm()) {
      setSubmitted(true);
      setNext(true);
      setActiveTab(1);
      saveSelectedValues();
    }
  };

  const handleSubmit2 = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedImgFile === null) {
      setMessage('Please upload a cover image.');
      setShowPopup(true);
    } else {
      setIsLoading(true);
      setLoadingMessage('Uploading beat...');
      setBeat({
        beatUsername: username,
        beatFile: selectedMusicFile,
        beatTitle: title,
        beatBpm: parseInt(bpmValue),
        beatTags: tags,
        beatMoods: moods,
        beatGenre: genre,
        beatInstruments: instruments,
        beatDescription: description,
        beatPic: selectedImgFile,
      });
      await uploadBeat({
        beatUsername: username,
        beatFile: selectedMusicFile,
        beatTitle: title,
        beatBpm: parseInt(bpmValue),
        beatTags: tags,
        beatMoods: moods,
        beatGenre: genre,
        beatInstruments: instruments,
        beatDescription: description,
        beatPic: selectedImgFile,
      });
    }
  };

  async function uploadBeat(beatToUpload: Beat) {
    setIsLoading(true);

    const url = buildApiUrl('/v1/api/posts/upload');
    const headers = {
      accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    const formData = new FormData();
    formData.append('cover_file', beatToUpload.beatPic as Blob, beatToUpload.beatPic?.name);
    formData.append('audio_file', beatToUpload.beatFile as Blob, beatToUpload.beatFile?.name);
    formData.append('description', beatToUpload.beatDescription);
    formData.append('genre', beatToUpload.beatGenre);
    formData.append('tags', JSON.stringify(beatToUpload.beatTags));
    formData.append('moods', JSON.stringify(beatToUpload.beatMoods));
    formData.append('instruments', JSON.stringify(beatToUpload.beatInstruments));
    formData.append('bpm', beatToUpload.beatBpm.toString());
    formData.append('title', beatToUpload.beatTitle);

    try {
      const response = await axios.post(url, formData, { headers });
      if (response.status >= 200 && response.status < 300) {
        console.log('Beat uploaded successfully.');
        setMessage('Beat uploaded successfully.');
        setShowPopup(true);
        setSuccessfulUpload(true);
      }
    } catch (error) {
      console.error('Error uploading beat:', error);
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.detail || 'Error uploading beat. Please try again.');
      } else {
        setMessage('Error uploading beat. Please try again.');
      }
      setShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  }

  const handleClose = () => {
    if (successfulUpload) {
      navigate('/Dashboard');
    }
    setShowPopup(false);
  };

  const validateForm = () => {
    if (!title || !username || !genre || instruments.length === 0 || tags.length === 0 || !bpmValue) {
      setMessage('Please fill in all fields.');
      setShowPopup(true);
      return false;
    }

    if (!selectedMusicFile) {
      setMessage('Please upload a file.');
      setShowPopup(true);
      return false;
    }

    if (!termsAccepted || !noCopyrightInfringement) {
      setMessage('Please accept the terms and conditions and confirm that you are not uploading copyrighted content');
      setShowPopup(true);
      return false;
    }

    setBeat({
      beatUsername: username,
      beatFile: selectedMusicFile,
      beatTitle: title,
      beatBpm: parseInt(bpmValue),
      beatTags: tags,
      beatMoods: moods,
      beatGenre: genre,
      beatInstruments: instruments,
      beatDescription: description,
      beatPic: selectedImgFile,
    });
    return true;
  };




  const openAudioPicker = () => audioInputRef.current?.click();
  const openCoverPicker = () => coverInputRef.current?.click();

  const removeImage = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedImgFile(null);
  };

  const saveSelectedValues = () => {
    localStorage.setItem('genre', genre);
    localStorage.setItem('moods', JSON.stringify(moods));
    localStorage.setItem('instruments', JSON.stringify(instruments));
  };

  const onFileInputChange1 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file && !SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      setMessage('File format not supported. Please upload a .wav, .mp3, or .m4a file');
      setShowPopup(true);
    } else {
      setSelectedMusicFile(file);
    }
  };

  const onFileInputChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const fileType = file.type;
      if (SUPPORTED_IMAGE_TYPES.includes(fileType)) {
        setSelectedImgFile(file);
        setBeat({
          ...beat,
          beatPic: file,
        });
      } else {
        setMessage('This file format is not supported.');
        setShowPopup(true);
      }
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>, target: 'audio' | 'cover') => {
    event.preventDefault();
    setDragTarget(target);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragTarget(null);
  };

  const onDrop1 = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragTarget(null);
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    if (file && !['audio/wav', 'audio/mpeg', 'audio/flac'].includes(file.type)) {
      setMessage('File format not supported. Please upload a .wav, .mp3, or .flac file');
      setShowPopup(true);
    } else {
      setSelectedMusicFile(file);
    }
  };

  const onDrop2 = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragTarget(null);
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    if (!file) {
      return;
    }
    const validImageTypes = ['image/gif', 'image/jpeg', 'image/jpg', 'image/png'];
    if (validImageTypes.includes(file.type)) {
      setSelectedImgFile(file);
    } else {
      setMessage('This file format is not supported.');
      setShowPopup(true);
    }
  };

  const handleTagsChange = (updatedTags: string[]) => {
    const normalizedTags = updatedTags.map((tag) =>
      tag.startsWith('#') ? tag.replace(/\s/g, '') : `#${tag.replace(/\s/g, '')}`,
    );
    setTags(normalizedTags);
  };

  const beforeAddTagsInput = (tag: string, existingTags: string[]) => {
    const tagExists = existingTags.includes(tag) || existingTags.includes(`#${tag}`);
    return !tagExists;
  };

  return (
    <div className="app upload-page">
      {showPopup && <CustomPopup message={message} onClose={handleClose} />}
      {isLoading && <Loading message={loadingMessage} />}
      <Header />

      <main className="upload-main">
        <section className="upload-shell">
          <div className="upload-progress">
            <div>
              <p className="upload-eyebrow">Upload</p>
              <h1>{next ? 'Add the finishing details' : 'Share your beat with style'}</h1>
              <p className="upload-subtitle">
                {next
                  ? 'Add cover art and a description before publishing your beat.'
                  : 'Complete the essential information and prepare the file for upload.'}
              </p>
            </div>
            <div className="tabs tabs-inline">
              <animated.div
                style={spring}
                className={`tab-indicator ${next ? 'inactive' : 'active'}`}
                onClick={() => {
                  setNext(false);
                  setActiveTab(0);
                }}
              />
              <animated.div
                style={spring}
                className={`tab-indicator ${next ? 'active' : 'inactive'}`}
                onClick={() => {
                  if (validateForm()) {
                    setNext(true);
                                  setActiveTab(1);
                  }
                }}
              />
            </div>
          </div>

          {!next ? (
            <animated.div className="centerDiv-Upload" style={slideAnimationInitial}>
              <section className="upload-grid upload-grid-primary">
                <div className="panel upload-drop-panel">
                  <div className="panel-header">
                    <h2>Audio file</h2>
                    <p>Drag and drop your beat or browse files.</p>
                  </div>
                  <div
                    className={`image-container ${dragTarget === 'audio' ? 'dragging' : ''}`}
                    onClick={openAudioPicker}
                    onDragOver={(event) => onDragOver(event, 'audio')}
                    onDragEnter={(event) => onDragOver(event, 'audio')}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop1}
                  >
                    <input
                      type="file"
                      id="audioFileInput"
                      ref={audioInputRef}
                      style={{ display: 'none' }}
                      accept=".wav,.mp3,.flac"
                      onChange={onFileInputChange1}
                    />
                    <div className="dropzone-copy">
                      <h3 className="dropzone-title">
                        {selectedMusicFile ? selectedMusicFile.name : 'Click or drag your beat here'}
                      </h3>
                      <p className="dropzone-description">
                        {selectedMusicFile
                          ? 'You can click here again if you want to replace it.'
                          : 'Supported formats: .wav, .mp3 and .flac'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="panel form-panel">
                  <div className="panel-header">
                    <h2>Beat details</h2>
                    <p>Use clear information so artists can find your track faster.</p>
                  </div>
                  <form className="info-form">
                    <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <input
                      type="number"
                      max={maxBPM}
                      min={0}
                      placeholder="Tempo"
                      value={bpmValue}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setBpmValue('');
                        } else {
                          const value = parseInt(e.target.value);
                          if (value >= 0 && value <= maxBPM) {
                            setBpmValue(value.toString());
                          }
                        }
                      }}
                    />
                    <TagsInput
                      value={tags}
                      onChange={handleTagsChange}
                      beforeAddValidate={beforeAddTagsInput}
                      name="tags"
                      placeHolder="#Tags"
                    />
                    <GlobalSelect
                      options={genresList}
                      isSearchable={true}
                      isMulti={false}
                      placeholder="Genres"
                      value={genre}
                      onChange={(selected) => setGenre(selected && !Array.isArray(selected) ? selected.value : '')}
                    />
                    <GlobalSelect
                      options={moodsList}
                      isSearchable={true}
                      isMulti={true}
                      placeholder="Mood"
                      value={moods.map((mood) => ({ value: mood, label: mood }))}
                      onChange={(selected) =>
                        setMoods(Array.isArray(selected) ? selected.map((item: { value: string }) => item.value) : [])
                      }
                    />
                    <GlobalSelect
                      options={instrumentsList}
                      isSearchable={true}
                      isMulti={true}
                      placeholder="Instruments"
                      value={instruments.map((instrument) => ({ value: instrument, label: instrument }))}
                      onChange={(selected) =>
                        setInstruments(Array.isArray(selected) ? selected.map((item: { value: string }) => item.value) : [])
                      }
                    />
                  </form>
                </div>

                <div className="panel actions-panel">
                  <div className="panel-header">
                    <h2>Confirm</h2>
                    <p>Accept the conditions before moving on to the cover step.</p>
                  </div>
                  <form className="next-form" onSubmit={handleSubmit1}>
                    <div className="checkboxes">
                      <label className="check-row">
                        <input
                          className="checkbox"
                          type="checkbox"
                          id="terms"
                          checked={termsAccepted}
                          onChange={() => setTermsAccepted(!termsAccepted)}
                        />
                        <span className="termsTxt">I have read and accept the terms and conditions</span>
                      </label>
                      <label className="check-row">
                        <input
                          className="checkbox"
                          type="checkbox"
                          id="copyright"
                          checked={noCopyrightInfringement}
                          onChange={() => setNoCopyrightInfringement(!noCopyrightInfringement)}
                        />
                        <span className="copyrightTxt">I confirm that I am not uploading copyrighted content</span>
                      </label>
                    </div>
                    <button className="next-btn" type="submit">
                      <span>Next step</span>
                      <img className="next-btn-img" src={rightarrow} alt="Next" />
                    </button>
                  </form>
                </div>
              </section>
            </animated.div>
          ) : (
            <animated.div className="centerDiv-Upload" style={slideAnimationNext}>
              <section className="upload-grid upload-grid-secondary">
                <div className="panel cover-panel panel-wide">
                  <div className="panel-header">
                    <h2>Description</h2>
                    <p>Add context, mood, and anything important about this beat.</p>
                  </div>
                  <textarea
                    className="next-caption"
                    spellCheck={false}
                    placeholder="Add a caption or a description for this beat..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="panel cover-panel panel-wide">
                  <div className="panel-header">
                    <h2>Cover art</h2>
                    <p>Upload an eye-catching image that matches the beat.</p>
                  </div>
                  <form className="next-form" onSubmit={handleSubmit2}>
                    <div
                      className={`next-image-container ${dragTarget === 'cover' ? 'dragging' : ''}`}
                      onClick={openCoverPicker}
                      onDragOver={(event) => onDragOver(event, 'cover')}
                      onDragEnter={(event) => onDragOver(event, 'cover')}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop2}
                    >
                      <input
                        type="file"
                        id="coverFileInput"
                        ref={coverInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={onFileInputChange2}
                      />
                      {selectedImgFile && imagePreviewUrl ? (
                        <>
                          <img src={imagePreviewUrl} alt="Selected" className="selected-image" />
                          <button onClick={removeImage} className="remove-image-button" type="button">
                            ×
                          </button>
                          <p className="lower-centered-text lower-centered-text-shadow">
                            Click here to change the file
                          </p>
                        </>
                      ) : (
                        <div className="dropzone-copy">
                          <h3 className="dropzone-title">Upload your cover art here</h3>
                          <p className="dropzone-description">Supported formats: .jpg, .png and .gif</p>
                        </div>
                      )}
                    </div>
                    <button className="upload-btn" type="submit">
                      <b>Upload Beat</b>
                    </button>
                  </form>
                </div>
              </section>
            </animated.div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Upload;
