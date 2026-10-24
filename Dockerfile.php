FROM php:8.4-cli
RUN --mount=type=secret,id=cloud_ca,target=/usr/local/share/ca-certificates/cloud.crt update-ca-certificates && sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources && apt-get update && apt-get install -y libicu-dev libonig-dev libsqlite3-dev libxml2-dev unzip git && docker-php-ext-install -j4 intl && rm -rf /var/lib/apt/lists/*
RUN --mount=type=secret,id=cloud_ca,target=/usr/local/share/ca-certificates/cloud.crt update-ca-certificates && apt-get update && apt-get install -y libpng-dev libjpeg62-turbo-dev libwebp-dev libzip-dev && docker-php-ext-configure gd --with-jpeg --with-webp && docker-php-ext-install -j4 gd zip && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN printf 'memory_limit=256M\nupload_max_filesize=10M\npost_max_size=12M\n' > /usr/local/etc/php/conf.d/stable.ini
WORKDIR /app/backend
CMD ["php", "spark", "serve", "--host", "0.0.0.0", "--port", "8080"]
