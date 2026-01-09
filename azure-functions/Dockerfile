# Azure Functions Dockerfile
FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    NODE_ENV=production

WORKDIR /home/site/wwwroot

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN NODE_ENV=development npm ci --no-audit --no-fund

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# dist를 런타임 루트로 교체하고, 런타임용 의존성만 설치합니다(package.dist.json 기반).
RUN mkdir -p /tmp/appdist \
    && cp -r dist/* /tmp/appdist/ \
    && rm -rf /home/site/wwwroot/* \
    && cp -r /tmp/appdist/* /home/site/wwwroot/ \
    && npm install --omit=dev --no-audit --no-fund

EXPOSE 80

