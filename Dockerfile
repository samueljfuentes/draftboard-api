FROM node:12.20.0

WORKDIR /usr/src/draftboard-api

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]