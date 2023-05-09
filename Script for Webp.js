// select the file selector and image previews container
let refs = {};
refs.imagePreviews = document.querySelector('#previews');
refs.fileSelector = document.querySelector('input[type=file]');

// generate "Download All" button and add it to the page
refs.downloadButton = document.createElement("button");
refs.downloadButton.setAttribute("id", "downloadAll");
refs.downloadButton.textContent = "Download All";
refs.downloadButton.style.display = "none"; // hide the button initially
refs.imagePreviews.parentNode.insertBefore(refs.downloadButton, refs.imagePreviews.nextSibling);

function addImageBox(container) {
  let imageBox = document.createElement("div");
  let progressBox = document.createElement("progress");
  imageBox.appendChild(progressBox);
  container.appendChild(imageBox);
  return imageBox;
}

function processFile(file) {
  if (!file) {
    return;
  }
  console.log(file);
  let imageBox = addImageBox(refs.imagePreviews);

  new Promise(function (resolve, reject) {
    let rawImage = new Image();
    rawImage.addEventListener("load", function () {
      resolve(rawImage);
    });
    rawImage.src = URL.createObjectURL(file);
  })
    .then(function (rawImage) {
      return new Promise(function (resolve, reject) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext("2d");
        canvas.width = rawImage.width;
        canvas.height = rawImage.height;
        ctx.drawImage(rawImage, 0, 0);
        canvas.toBlob(function (blob) {
          resolve(URL.createObjectURL(blob));
        }, "image/webp");
      });
    })
    .then(function (imageURL) {
      return new Promise(function (resolve, reject) {
        let scaledImg = new Image();
        scaledImg.addEventListener("load", function () {
          resolve({ imageURL, scaledImg });
        });
        scaledImg.setAttribute("src", imageURL);
      });
    })
    .then(function (data) {
      let imageLink = document.createElement("a");
      imageLink.setAttribute("href", data.imageURL);
      imageLink.setAttribute('download', `${file.name}.webp`);
      imageLink.appendChild(data.scaledImg);
      imageBox.innerHTML = "";
      imageBox.appendChild(imageLink);
      refs.downloadButton.style.display = "inline-block"; // show the button once an image is processed
    });
}

function processFiles(files) {
  for (let file of files) {
    processFile(file);
  }
}

function fileSelectorChanged() {
  processFiles(refs.fileSelector.files);
  refs.fileSelector.value = "";
}

refs.fileSelector.addEventListener("change", fileSelectorChanged);

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(callback, e) {
  e.stopPropagation();
  e.preventDefault();
  callback(e.dataTransfer.files);
}

function setDragDrop(area, callback) {
  area.addEventListener("dragenter", dragenter, false);
  area.addEventListener("dragover", dragover, false);
  area.addEventListener("drop", function (e) { drop(callback, e); }, false);
}

setDragDrop(document.documentElement, processFiles);

// generate download link for all images and add them to the download button
refs.downloadButton.addEventListener("click", function () {
  let links = [];
  document.querySelectorAll("#previews a").forEach(function (imageLink) {
    let imageURL = imageLink.getAttribute("href");
    let fileName = imageURL.split('/').pop();
    let downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", imageURL);
    downloadLink.setAttribute("download", fileName);
    downloadLink.style.display = "none";
    links.push(downloadLink);
    document.body.appendChild(downloadLink);
  });

  // simulate click on each download link
  links.forEach(function (downloadLink) {
    downloadLink.click();
  });

  // clear the download links after 2 sec
  setTimeout(function () {
    links.forEach(function (downloadLink) {
      document.body.removeChild(downloadLink);
    });
  }, 2000);
});