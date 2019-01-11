start:
	npm run daemon
stop:
	npm run stop
restart:
	npm run restart
logs:
	npm run logs
ps:
	npm run ps
build:
	npm run assemble
clean:
	npm run clean
reset:
	npm run reset
bin: clean build
	./build/gitbot

